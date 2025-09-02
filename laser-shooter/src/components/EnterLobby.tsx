
function EnterLobby(){

    return(
        <div>
            <button>Create Lobby</button>
            <form>
                <label htmlFor="lobbyCode">Enter lobby code</label>
                <input type="text"></input>
                <button>Join As Player</button>
                <button>Join As Spectator</button>
            </form>
        </div>
    );
}

export default EnterLobby;