
function EnterCallName(){

    return(
        <div className="Center">
            <form>
                <label htmlFor="name">Enter your name</label>
                <input type="text" aria-required="true"></input>
                <button type="submit">Enter Arena</button>
            </form>
        </div>
    );

}

export default EnterCallName;