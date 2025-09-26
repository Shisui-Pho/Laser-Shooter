//Welcome Galane:2024671386
//Phiwokwakhe Khathwane: 2022004325

import { useState } from "react";
import EnterCallName from "../../components/EnterCallName";
import EnterLobby from "../../components/EnterLobby";

//The home page
function Index() {
  
  //State to track if the user has submitted a call name
  const [submitted, setSubmitted] = useState(false);

  //Return the enter callname component if the user has not submitted a name
  //Or return the Enter lobby component if the user has submitted a call name
  return (
    <div className="hack-black-background">
      {!submitted && (
        <EnterCallName  setSubmitted = {setSubmitted}/>
      )}
      {submitted && (
        <EnterLobby/>
      )}
    </div>
  );
}

export default Index;