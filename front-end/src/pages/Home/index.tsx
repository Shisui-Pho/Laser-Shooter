//Welcome Galane:2024671386
//Phiwokwakhe Khathwane: 2022004325

import { useState } from "react";
import EnterCallName from "../../components/EnterCallName";
import EnterLobby from "../../components/EnterLobby";

function Index() {
  //
  const [submitted, setSubmitted] = useState(false);
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