// components/GameOver/GameOver.tsx
import React from 'react';
import type { Lobby, User} from '../models/User';
import styles from './GameOver.module.css';
import { useNavigate } from 'react-router-dom';
import { lobbyService } from '../services/LobbyServices';
import WebsockService from '../services/WebSocketService'
import { useError } from "../context/ErrorContext";
interface GameOverProps {
  lobbyDetails: Lobby;
  user: User | null;
}

const GameOver: React.FC<GameOverProps> = ({ lobbyDetails, user = null}) => {
  const winningTeam = lobbyDetails.teams.find(team => team.score === Math.max(...lobbyDetails.teams.map(t => t.score || 0)));
  const isTie = lobbyDetails.teams.every(team => team.score === lobbyDetails.teams[0].score);
  const navigate = useNavigate();
  const { addError } = useError();

  async function onReturnToMain() {
    if(user){
      try{
        //Leave team
        await lobbyService.leaveTeam(lobbyDetails.code, user);
        WebsockService.disconnect();
      }catch{
        //HACK: We could have just swallowed the exception here, it wouldn't hurt anyone :)
        addError("Disconnected", 'info');
      }
    }
    navigate('/', {replace:true});
  }
  return (
    <div className={styles.gameOverlay}>
      <div className={styles.gameOverContent}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>MISSION COMPLETE</h1>
          <div className={styles.subtitle}>ENGAGEMENT TERMINATED</div>
        </div>

        {/* Results */}
        <div className={styles.resultsContainer}>
          {isTie ? (
            <div className={styles.tieMessage}>
              <div className={styles.tieIcon}>⚔️</div>
              <h2 className={styles.tieTitle}>TACTICAL STANDOFF</h2>
              <p className={styles.tieText}>All squads demonstrated equal combat proficiency</p>
            </div>
          ) : (
            <div className={styles.winnerSection}>
              <div className={styles.winnerBadge}>VICTORIOUS SQUAD</div>
              <h2 className={styles.winnerTeam}>
                SQUAD {winningTeam?.color.toUpperCase()} • {winningTeam?.shape}
              </h2>
              <div className={styles.winnerScore}>
                COMBAT SCORE: {winningTeam?.score ?? 0}
              </div>
            </div>
          )}

          {/* Team Standings */}
          <div className={styles.standings}>
            <h3 className={styles.standingsTitle}>FINAL STANDINGS</h3>
            <div className={styles.standingsList}>
              {lobbyDetails.teams
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .map((team, index) => (
                  <div key={team.id} className={styles.standingItem}>
                    <div className={styles.standingRank}>#{index + 1}</div>
                    <div className={styles.standingTeam}>
                      <span className={styles.teamName}>
                        Squad {team.color.toUpperCase()} • {team.shape}
                      </span>
                      <span className={styles.teamScore}>{team.score ?? 0} pts</span>
                    </div>
                    {index === 0 && !isTie && (
                      <div className={styles.victoryCrown}>👑</div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={onReturnToMain}
          className={styles.returnButton}
        >
          RETURN TO COMMAND CENTER
        </button>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerText}>
            LASER_SHOOTER_PROTOCOL • MISSION_TERMINATED
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOver;