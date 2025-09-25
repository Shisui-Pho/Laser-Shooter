//Welcome Galane:2024671386
//Phiwokwakhe Khathwane: 2022004325

import React from "react";
import "../App.css";

//Crosshair properties
interface CrosshairProps {
  //Crosshair color property to give the crosshair a dynamic color
  color: string;
}

//Build the cross hair using crosshair styling defined in App.css
const Crosshair: React.FC<CrosshairProps> = ({ color }) => {
  return (
    <div className="crosshair" style={{ color }}>
      <div className="circle outer" />
      <div className="circle inner" />
      <span className="line top" />
      <span className="line right" />
      <span className="line bottom" />
      <span className="line left" />
      <span className="plus h" />
      <span className="plus v" />
    </div>
  );
};

export default Crosshair;