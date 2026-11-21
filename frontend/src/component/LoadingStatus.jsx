function LoadingStatus({theme}){
    return <div className="Loading Container">
        <h2>Generating Your {theme} Story</h2>
        <div className="loading-animation">
            <div className="Spinner"></div>
    </div>
    <p className="loading-info">
        Please wait while we generate the story......
    </p>
    </div>
}
export default LoadingStatus;