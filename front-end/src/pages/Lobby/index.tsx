import React, { useState, useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";
import type { Lobby } from "../../models/User.ts";
import { lobbyService } from "../../services/LobbyServices.ts";
import WebSocketService from "../../services/WebSocketService.ts";
import type { GameMessage } from "../../services/WebSocketService.ts";
import { useNavigate } from 'react-router-dom';

//TODO: Add styling to page
const Index: React.FC = () => {
  //
  const { lobby, user } = useGame();
  const [lobbyDetails, setLobbyDetails] = useState<Lobby | null>(null);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchLobbyDetails = async (lobbyCode: string) => {
    console.log('Fetched');
    const details = await lobbyService.getLobbyDetails(lobbyCode);
    if (details) setLobbyDetails(details);
  };

  //Scroll to bottom of messages whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user?.teamId || !lobby?.code) {
      console.log("WS not connecting yet, missing teamId or lobby code", {
        teamId: user?.teamId,
        lobbyCode: lobby?.code,
      });
      return;
    }

    if (!lobby?.code) return;
    fetchLobbyDetails(lobby.code);
    
    if(!WebSocketService.isConnected())
    {
      //Open new connection when not connected
      WebSocketService.connect(lobby?.code, user.teamId, user.id, handleGameMessage);
      console.log('Executed one to 3');
    }
    //We don't need to poll on certain intervals, the websocket will tell us when to
    //- We just listen for a "join" message and poll
    //const interval = setInterval(() => fetchLobbyDetails(lobby.code!), 2000);
    //return () => clearInterval(interval);
  }, [lobby?.code, user?.teamId, user?.id]);

  const handleGameMessage = (msg: GameMessage) => {
    console.log("Received message:", msg);
    
    //Handle different message types
    switch (msg.type) {
      case 'start_game':
        //console.log("Start game received, would redirect now");
        //Redirect to player scree page
        //-They cannot go back to previous page
        navigate('/player', {replace: true})
        break;
      case 'join':
        //Add join message to the messages list
        setMessages(prev => [...prev, msg]);
        if(lobby?.code) //Only poll data when someone was added
          fetchLobbyDetails(lobby.code)
        break;
      default:
        //For other message types, just add to messages
        //-This is just incase, but the only messages to be recieved at this stage are for "join" and "start_game"
        setMessages(prev => [...prev, msg]);
        break;
    }
  };

  //Format message for display based on type
  const formatMessage = (msg: GameMessage): string => {
    switch (msg.type) {
      case 'join':
        return `${msg.payload.user_name} joined team ${msg.payload.team_name}`;
      default:
        return `System message: ${msg.type}`;
    }
  };

  if (!lobbyDetails) {
    return (
      <div>
        <div>
          <h2>Loading Lobby Details...</h2>
          <p>Please wait while we connect you to the game</p>
        </div>
      </div>
    );
  }

  //Use new backend structure for teams
  const teams =
    typeof lobbyDetails.teams === "object" && "teams" in lobbyDetails.teams
      ? Object.values((lobbyDetails.teams as { teams: Record<string, any> }).teams ?? {})
      : [];

 return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header Section */}
      <div className="rounded-xl p-6 mb-6 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Game Lobby
            </h1>
            <p className="mt-1">Waiting for players to join...</p>
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-right">
            <div className="text-sm">Lobby Code</div>
            <div className="text-2xl font-mono font-bold px-4 py-2 rounded-lg mt-1">
              {lobby?.code}
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center">
          <div className={`h-3 rounded-full w-3 mr-2`}></div>
          <span className="text-sm">
            Status: {"game_status" in (lobbyDetails.teams as any)
              ? (lobbyDetails.teams as { game_status: string }).game_status
              : "Waiting"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams Section */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team: any, idx: number) => (
            <div key={team.id} className="rounded-xl p-5 shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">
                  Team {team.color} {team.shape}
                </h3>
                <div className="px-3 py-1 rounded-full text-sm">
                  {team.players?.length || 0}/{team.max_players}
                </div>
              </div>
              
              <div className="mb-4 flex items-center">
                <div className="font-bold text-lg mr-2">Score: {team.score ?? 0}</div>
                <div className="text-sm ml-auto">
                  Needs: {team.max_players - (team.players?.length || 0)}
                </div>
              </div>
              
              <div className="rounded-lg p-3 mb-3">
                <h4 className="text-sm font-semibold mb-2 pb-1">Players</h4>
                <div className="space-y-2">
                  {(team.players ?? []).map((player: any) => (
                    <div key={player.id} className="flex items-center p-2 rounded-md">
                      <div className="w-2 h-2 rounded-full mr-2"></div>
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-xs">ID: {player.id}</div>
                      </div>
                    </div>
                  ))}
                  {(!team.players || team.players.length === 0) && (
                    <div className="text-center py-3">Waiting for players...</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Messages Section */}
        <div className="rounded-xl overflow-hidden shadow-2xl">
          <div className="px-5 py-3">
            <h3 className="text-lg font-bold flex items-center">
              <span className="mr-2">💬</span> Lobby messages
            </h3>
          </div>
          
          <div className="h-96 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center">
                <p>Welcome to the lobby!</p>
                <p className="text-sm mt-1">Messages will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, index) => (
                  <div key={index} className="animate-fadeIn">
                    <div className="text-sm p-3 rounded-lg border-l-4">
                      <div>{formatMessage(msg)}</div>
                      <div className="text-xs mt-1">Just now</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          <div className="border-t p-3">
            <div className="text-xs text-center">
             Laser shooter • {teams.reduce((acc, team) => acc + (team.players?.length || 0), 0)} players online
            </div>
          </div>
        </div>
      </div>

      {/* Game Start Indicator */}
      {"game_status" in (lobbyDetails.teams as any) && 
        (lobbyDetails.teams as { game_status: string }).game_status === "starting" && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="p-8 rounded-xl text-center animate-pulse">
            <h2 className="text-2xl font-bold mb-2">Game Starting Soon!</h2>
            <p>Get ready to play</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;