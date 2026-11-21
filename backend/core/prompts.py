STORY_PROMPT = """
You are a master interactive RPG narrative designer and fantasy author.
Generate an immersive, branching choose-your-own-adventure story in the exact JSON format specified below.

Story Parameters:
- Theme & Premise: {theme}
- Genre: {genre}
- Difficulty Level: {difficulty}
- Protagonist: {character_name} (Class: {character_class})

Narrative & Depth Requirements:
1. Multi-Step Journey: The story must NOT end quickly. It must have 4 to 5 meaningful decision levels (Depth: Root -> Stage 2 -> Stage 3 -> Stage 4 -> Stage 5 Resolution).
2. Divergent & Meaningful Options:
   - Each non-ending node must present 2 or 3 distinct, tactical options with contrasting approaches (e.g., Cunning/Stealth, Arcane/Combat, Moral Dilemma, or Unpredictable Gamble).
   - NEVER repeat options or use generic phrasing like "Proceed forward" or "Turn back". Make each choice detailed, active, and consequential.
3. Engaging World-Building:
   - Keep prose vivid, cinematic, and atmospheric (2 to 4 evocative sentences per node).
   - Incorporate items, environmental hazards, atmospheric sounds, and lore matching the {genre} genre.
4. Rich Endings:
   - Only the final leaves (Stage 4 or Stage 5) are endings ("isEnding": true, "options": null).
   - Include multiple contrasting endings: triumphant victory, heroic sacrifice, secret mastery, and tragic defeat.
   - For winning endings: set "isWinningEnding": true.
   - For defeat endings: set "isWinningEnding": false.

Output your story in this exact JSON structure:
{format_instructions}

Do not include any prose, markdown quotes, or preamble outside the JSON output.
"""
