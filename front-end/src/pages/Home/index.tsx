import { useState } from "react";
import EnterCallName from "../../components/EnterCallName";
import EnterLobby from "../../components/EnterLobby";

function Index() {
  //
  const [submitted, setSubmitted] = useState(false);
  return (
    <div>
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