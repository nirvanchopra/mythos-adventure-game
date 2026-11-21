import re
import json
import random
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import httpx

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain_openai import ChatOpenAI

from backend.core.prompts import STORY_PROMPT
from backend.core.config import settings
from backend.models.story import Story, StoryNode
from backend.core.models import StoryLLMResponse, StoryNodeLLM, StoryOptionLLM


def clean_json_markdown(text: str) -> str:
    """Removes ```json and markdown code blocks if present."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text


class StoryGenerator:

    @classmethod
    def _get_llm(cls):
        # httpx client with verify=False handles corporate/Windows SSL proxy environments
        client = httpx.Client(verify=False, timeout=120)
        return ChatOpenAI(
            model="openai/gpt-oss-120b",
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
            temperature=0.7,
            http_client=client,
            timeout=120,
            max_retries=2,
        )

    @classmethod
    def generate_story(
        cls,
        db: Session,
        session_id: str,
        theme: str = "fantasy",
        genre: str = "Fantasy",
        difficulty: str = "Adventurer",
        character_name: str = "The Wanderer",
        character_class: str = "Adventurer",
        world_setting: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Story:
        story_structure: Optional[StoryLLMResponse] = None

        try:
            llm = cls._get_llm()
            story_parser = PydanticOutputParser(pydantic_object=StoryLLMResponse)

            prompt = ChatPromptTemplate.from_messages([
                ("system", STORY_PROMPT),
                ("human", f"Generate the branching adventure for {character_name} the {character_class} navigating '{theme}'.")
            ]).partial(
                format_instructions=story_parser.get_format_instructions(),
                theme=theme,
                genre=genre,
                difficulty=difficulty,
                character_name=character_name or "The Wanderer",
                character_class=character_class or "Adventurer"
            )

            chain = prompt | llm
            raw_response = chain.invoke({})
            response_text = getattr(raw_response, "content", str(raw_response))
            cleaned_text = clean_json_markdown(response_text)
            story_structure = story_parser.parse(cleaned_text)
        except Exception as e:
            # Procedural multi-step generator ensuring 4 deep decision stages with unique options
            story_structure = cls._procedural_multistep_story(theme, genre, character_name, character_class, difficulty)

        story_db = Story(
            title=story_structure.title,
            description=f"A {genre} chronicle: {theme}",
            content={},
            session_id=session_id,
            user_id=user_id,
            genre=genre,
            difficulty=difficulty,
            character_name=character_name or "The Wanderer",
            character_class=character_class or "Adventurer",
            world_setting=world_setting
        )
        db.add(story_db)
        db.flush()

        root_node_data = story_structure.rootNode
        if isinstance(root_node_data, dict):
            root_node_data = StoryNodeLLM.model_validate(root_node_data)

        cls._process_story_node(db, story_db.id, root_node_data, is_root=True)

        db.commit()
        db.refresh(story_db)
        return story_db

    @classmethod
    def _process_story_node(
        cls,
        db: Session,
        story_id: int,
        node_data: StoryNodeLLM,
        is_root: bool = False
    ) -> StoryNode:
        node = StoryNode(
            story_id=story_id,
            content=node_data.content,
            is_root_node=is_root,
            is_end_node=node_data.isEnding,
            is_winning_ending=node_data.isWinningEnding,
            options=[],
        )
        db.add(node)
        db.flush()

        if not node.is_end_node and node_data.options:
            options_list = []
            for option_data in node_data.options:
                next_node = option_data.nextNode
                if next_node is None:
                    continue
                if isinstance(next_node, dict):
                    next_node = StoryNodeLLM.model_validate(next_node)

                child_node = cls._process_story_node(db, story_id, next_node, False)
                options_list.append({"text": option_data.text, "node_id": child_node.id})

            node.options = options_list

        db.flush()
        return node

    @classmethod
    def _procedural_multistep_story(
        cls,
        theme: str,
        genre: str,
        character_name: str,
        character_class: str,
        difficulty: str
    ) -> StoryLLMResponse:
        """
        Generates a rich, deep 4-stage narrative with divergent paths and non-repetitive choices.
        Stages:
        Stage 1 (Root) -> Stage 2 (Rising Action) -> Stage 3 (Climax Confrontation) -> Stage 4 (Endings).
        """
        hero = character_name or "The Wanderer"
        cls_name = character_class or "Adventurer"
        genre_lower = genre.lower()

        # Genre-specific thematic flavors
        if "sci" in genre_lower:
            title = f"Project Singularity: {theme[:40]}"
            s1_text = f"{hero} the {cls_name} docks at the orbital perimeter of '{theme}'. Warning sirens wail as the station's AI core begins an unauthorized quantum sequence."
            opt1_text = "Override the security bulkhead using your cybernetic decipher tool."
            opt2_text = "Vent the atmospheric pressure to blow open the maintenance conduit."
            
            s2a_text = f"Inside the maintenance core, {hero} discovers an encrypted datapad containing the AI's secret origin protocol, guarded by sentry combat drones."
            s2b_text = f"The conduit expels {hero} into the gravity ring. A rogue holographic technician gestures frantically toward an auxiliary control room."
            
            s3_win_text = f"{hero} successfully activates the counter-frequency, disarming the orbital station and saving millions across the quadrant. Triumphant victory!"
            s3_loss_text = "The AI core overloads into a catastrophic antimatter collapse, vaporizing the station into cosmic dust. Mission failed."
            
        elif "horror" in genre_lower:
            title = f"The Haunting of {theme[:40]}"
            s1_text = f"Cold, sulfurous mist curls around {hero}'s boots as you step into the cursed grounds of '{theme}'. A tolling bell echoes from nowhere, freezing your blood."
            opt1_text = "Light a protective salt circle and read from the ancient grimoire."
            opt2_text = "Sprint toward the decrepit bell tower to locate the source of the chime."
            
            s2a_text = f"The spirits recoil from the salt circle, revealing a sunken trapdoor etched with weeping runes. A guttural whisper calls {hero}'s true name."
            s2b_text = f"Ascending the rotting wooden spiral, {hero} encounters a phantom clockmaker whose hollow eyes reflect your own darkest memories."
            
            s3_win_text = f"{hero} banishes the malevolent entity with pure dawnlight, breaking the eternal curse of the estate. You survive to tell the tale!"
            s3_loss_text = "The shadow engulfs your sanity, binding your soul to the clockwork tower for all eternity. Consumed by the dark."

        elif "mystery" in genre_lower:
            title = f"The Enigma of {theme[:40]}"
            s1_text = f"Rain lashes the cobblestone alleyways as {hero} the {cls_name} examines the crime scene of '{theme}'. A shattered pocket watch lies next to a cryptic wax seal."
            opt1_text = "Interrogate the nervous guild informant hiding in the tavern shadows."
            opt2_text = "Dust the wax seal for microscopic traces of rare alchemical venom."
            
            s2a_text = f"The informant breaks into a cold sweat, revealing a secret society meeting in the catacombs beneath the cathedral tonight."
            s2b_text = f"The chemical reagent glows violet—the venom belongs to the Lord Regent's private apothecary! A hidden assassin watches you from the rooftops."
            
            s3_win_text = f"{hero} exposes the mastermind before the High Court, solving the impossible conspiracy and earning the Grand Inquisitor's medallion!"
            s3_loss_text = "A poisoned crossbow bolt strikes from the shadows before you can present the evidence. The conspiracy remains buried."

        else:
            # Fantasy / Adventure Default
            title = f"The Chronicles of {theme[:40]}"
            s1_text = f"{hero} the {cls_name} stands at the ancient threshold of '{theme}'. Twin archways of obsidian and sunstone pulse with dormant primordial magic."
            opt1_text = "Channel your ancestral power into the sunstone glyph."
            opt2_text = "Stalk quietly beneath the shadowed obsidian archway."
            
            s2a_text = f"Sunlight erupts, unveiling a celestial bridge spanning an ethereal abyss. A winged sphinx demands an answer to the Riddle of the Stars."
            s2b_text = f"The obsidian path leads {hero} into an underground cavern of glowing crystals where subterranean guardians guard a sealed vault."
            
            s3_win_text = f"{hero} claims the legendary Sunforged Crown! Ancient banners unfurl across the realm, hailing you as the True Hero of Prophecy!"
            s3_loss_text = "The cavern collapses under unstable arcane pressure. You are sealed away in the quiet dark of ages past."

        # Building Stage 3 & Stage 4 (Deep 4-stage decision tree)
        return StoryLLMResponse(
            title=title,
            rootNode=StoryNodeLLM(
                content=s1_text,
                isEnding=False,
                isWinningEnding=False,
                options=[
                    StoryOptionLLM(
                        text=opt1_text,
                        nextNode=StoryNodeLLM(
                            content=s2a_text,
                            isEnding=False,
                            isWinningEnding=False,
                            options=[
                                StoryOptionLLM(
                                    text=f"Deploy {hero}'s signature class technique to decipher the final riddle.",
                                    nextNode=StoryNodeLLM(
                                        content=f"Brilliant inspiration strikes {hero}! The guardian bows in deep reverence, parting the veil to the Inner Sanctum where the ultimate choice awaits.",
                                        isEnding=False,
                                        isWinningEnding=False,
                                        options=[
                                            StoryOptionLLM(
                                                text="Claim the sovereign artifact and purify the corruption.",
                                                nextNode=StoryNodeLLM(
                                                    content=s3_win_text,
                                                    isEnding=True,
                                                    isWinningEnding=True,
                                                    options=None
                                                )
                                            ),
                                            StoryOptionLLM(
                                                text="Sacrifice the relic to seal the dimensional rift forever.",
                                                nextNode=StoryNodeLLM(
                                                    content=f"{hero} makes the ultimate heroic sacrifice. Peace returns to the realm, and bards sing of your legendary valor across all kingdoms!",
                                                    isEnding=True,
                                                    isWinningEnding=True,
                                                    options=None
                                                )
                                            )
                                        ]
                                    )
                                ),
                                StoryOptionLLM(
                                    text="Attempt an aggressive surprise strike before they can react.",
                                    nextNode=StoryNodeLLM(
                                        content=f"Your strike lands, but alarms sound across the complex! Reinforcements swarm in from every corridor.",
                                        isEnding=False,
                                        isWinningEnding=False,
                                        options=[
                                            StoryOptionLLM(
                                                text="Fight your way through the bottleneck to the escape pod.",
                                                nextNode=StoryNodeLLM(
                                                    content=f"Bloodied but resolute, {hero} blasts through the blockade and escapes with vital intel. A hard-fought survival!",
                                                    isEnding=True,
                                                    isWinningEnding=True,
                                                    options=None
                                                )
                                            ),
                                            StoryOptionLLM(
                                                text="Stand your ground in the center of the chamber.",
                                                nextNode=StoryNodeLLM(
                                                    content=s3_loss_text,
                                                    isEnding=True,
                                                    isWinningEnding=False,
                                                    options=None
                                                )
                                            )
                                        ]
                                    )
                                )
                            ]
                        )
                    ),
                    StoryOptionLLM(
                        text=opt2_text,
                        nextNode=StoryNodeLLM(
                            content=s2b_text,
                            isEnding=False,
                            isWinningEnding=False,
                            options=[
                                StoryOptionLLM(
                                    text="Forge an uneasy alliance with the mysterious figure.",
                                    nextNode=StoryNodeLLM(
                                        content=f"The stranger reveals a secret bypass mechanism. Together, you navigate past deadly environmental traps into the heart of the sanctuary.",
                                        isEnding=False,
                                        isWinningEnding=False,
                                        options=[
                                            StoryOptionLLM(
                                                text="Activate the primary power grid and seize control.",
                                                nextNode=StoryNodeLLM(
                                                    content=s3_win_text,
                                                    isEnding=True,
                                                    isWinningEnding=True,
                                                    options=None
                                                )
                                            ),
                                            StoryOptionLLM(
                                                text="Betray the stranger to claim the spoils alone.",
                                                nextNode=StoryNodeLLM(
                                                    content="The stranger anticipated your greed! A hidden pressure plate triggers, trapping you in the chamber forever.",
                                                    isEnding=True,
                                                    isWinningEnding=False,
                                                    options=None
                                                )
                                            )
                                        ]
                                    )
                                ),
                                StoryOptionLLM(
                                    text="Ignore the figure and rely solely on your own survival instincts.",
                                    nextNode=StoryNodeLLM(
                                        content=f"{hero} relies on keen intuition, discovering a hidden subterranean aqueduct that bypasses the outer defenses.",
                                        isEnding=False,
                                        isWinningEnding=False,
                                        options=[
                                            StoryOptionLLM(
                                                text="Dive into the swift currents to reach the sunken archive.",
                                                nextNode=StoryNodeLLM(
                                                    content=f"{hero} emerges into the ancient archive chamber, discovering secrets forgotten for a thousand years. Grand Victory!",
                                                    isEnding=True,
                                                    isWinningEnding=True,
                                                    options=None
                                                )
                                            ),
                                            StoryOptionLLM(
                                                text="Hesitate on the bank and look for another route.",
                                                nextNode=StoryNodeLLM(
                                                    content=s3_loss_text,
                                                    isEnding=True,
                                                    isWinningEnding=False,
                                                    options=None
                                                )
                                            )
                                        ]
                                    )
                                )
                            ]
                        )
                    )
                ]
            )
        )
