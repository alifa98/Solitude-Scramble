// import React, { useState, useEffect, useRef, useMemo } from 'react';
// import { Play, Pause, SkipBack, SkipForward, Upload, Trophy, Clock, AlertCircle, ChevronRight, RotateCcw, User, Zap, Globe, BarChart3 } from 'lucide-react';

// // --- Constants & Helpers ---

// const CAKE_EMOJI = "🍰";

// const INITIAL_SAMPLE_DATA = {
//   "matches": {
//     "sample_match": {
//       "players": ["bot_sample_1", "bot_sample_2", "bot_sample_3", "bot_sample_4"],
//       "final_scores": { "bot_sample_1": 10, "bot_sample_2": 15, "bot_sample_3": 5, "bot_sample_4": 0 },
//       "turn_data": [
//         {
//           "turn": 1,
//           "platform_scores": { "CENTER": 4, "NW": 4, "NE": 3, "SW": 3, "SE": 3 },
//           "player_move": { "bot_sample_1": "CENTER", "bot_sample_2": "RIGHT", "bot_sample_3": "LEFT", "bot_sample_4": "RIGHT" },
//           "scores_awarded": { "bot_sample_1": 4, "bot_sample_4": 3 },
//           "players_map": { "EAST": "bot_sample_1", "NORTH": "bot_sample_2", "WEST": "bot_sample_3", "SOUTH": "bot_sample_4" }
//         }
//       ]
//     }
//   }
// };

// // Map Home Position + Move Command to Target Platform
// const getTargetPlatform = (home, move) => {
//   if (move === 'CENTER') return 'CENTER';
  
//   const mapping = {
//     'NORTH': { 'LEFT': 'NE', 'RIGHT': 'NW' },
//     'EAST':  { 'LEFT': 'SE', 'RIGHT': 'NE' },
//     'SOUTH': { 'LEFT': 'SW', 'RIGHT': 'SE' },
//     'WEST':  { 'LEFT': 'NW', 'RIGHT': 'SW' }
//   };

//   return mapping[home]?.[move] || 'CENTER';
// };

// // Deterministic color generator for players
// const getPlayerColor = (name) => {
//   if (!name) return "bg-slate-300";
//   const gradients = [
//     "bg-gradient-to-br from-cyan-500 to-blue-600",
//     "bg-gradient-to-br from-emerald-400 to-green-600",
//     "bg-gradient-to-br from-orange-400 to-red-500",
//     "bg-gradient-to-br from-fuchsia-500 to-pink-600",
//     "bg-gradient-to-br from-violet-500 to-purple-600",
//   ];
//   let hash = 0;
//   for (let i = 0; i < name.length; i++) {
//     hash = name.charCodeAt(i) + ((hash << 5) - hash);
//   }
//   return gradients[Math.abs(hash) % gradients.length];
// };

// // --- Components ---

// // 1. Cake Display Component
// const CakeDisplay = ({ count }) => {
//   return (
//     <div className="flex flex-wrap justify-center gap-1 max-w-[80px]">
//       {Array.from({ length: count }).map((_, i) => (
//         <span key={i} className="text-lg leading-none drop-shadow-sm select-none transition-all hover:scale-110" role="img" aria-label="cake">
//           {CAKE_EMOJI}
//         </span>
//       ))}
//     </div>
//   );
// };

// // 2. Platform Component
// const Platform = ({ id, score, playersOnPlatform, isCollision, isScored }) => {
//   // Styling based on state - Light Mode Optimized
//   let borderColor = "border-slate-200";
//   let bgColor = "bg-white";
//   let shadow = "shadow-sm";
//   let scoreColor = "text-slate-500";
//   let labelColor = "bg-slate-100 text-slate-500 border-slate-200";

//   if (isCollision) {
//     borderColor = "border-red-300";
//     bgColor = "bg-red-50";
//     scoreColor = "text-red-400 opacity-60 decoration-line-through";
//     labelColor = "bg-red-100 text-red-500 border-red-200";
//     shadow = "shadow-inner";
//   } else if (isScored) {
//     borderColor = "border-amber-400";
//     bgColor = "bg-amber-50";
//     shadow = "shadow-[0_4px_15px_rgba(251,191,36,0.25)]";
//     scoreColor = "text-amber-600 font-bold";
//     labelColor = "bg-amber-100 text-amber-700 border-amber-200";
//   }

//   return (
//     <div className={`relative flex flex-col items-center justify-center w-full h-full min-h-[120px] rounded-2xl border-2 ${borderColor} ${bgColor} ${shadow} transition-all duration-500`}>
//       {/* Platform ID Label */}
//       <div className={`absolute -top-3 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest border uppercase ${labelColor} z-10`}>
//         {id}
//       </div>
      
//       {/* Score / Cakes */}
//       <div className={`mb-3 flex flex-col items-center z-0 ${scoreColor}`}>
//         <span className="text-[10px] font-bold tracking-wider mb-1">{score} PTS</span>
//         <CakeDisplay count={score} />
//       </div>

//       {/* Avatars on Platform */}
//       <div className="flex -space-x-3 overflow-visible absolute bottom-3 transition-all duration-500 z-10">
//         {playersOnPlatform.map((p, idx) => (
//           <div 
//             key={idx} 
//             className="w-10 h-10 rounded-full bg-white border-2 border-slate-100 shadow-md flex items-center justify-center p-0.5 transform hover:-translate-y-1 transition-transform"
//             title={p}
//           >
//             <div className={`w-full h-full rounded-full ${getPlayerColor(p)} flex items-center justify-center text-[10px] text-white font-bold`}>
//               {p.substring(0, 2).toUpperCase()}
//             </div>
//           </div>
//         ))}
//       </div>
      
//       {isCollision && (
//         <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
//           <div className="bg-red-100/80 p-1.5 rounded-full shadow-sm animate-bounce backdrop-blur-sm">
//             <Zap className="w-8 h-8 text-red-500 fill-red-500" strokeWidth={2} />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // 3. Main Game Board
// const GameBoard = ({ turnData }) => {
//   if (!turnData) return <div className="h-96 flex items-center justify-center text-slate-400 font-medium">No Turn Data</div>;

//   const { platform_scores, player_move, players_map, scores_awarded } = turnData;

//   // Calculate where everyone went
//   const platformOccupants = { CENTER: [], NW: [], NE: [], SW: [], SE: [] };
  
//   Object.entries(players_map).forEach(([homeDir, playerName]) => {
//     const move = player_move[playerName];
//     const target = getTargetPlatform(homeDir, move);
//     if (platformOccupants[target]) {
//       platformOccupants[target].push(playerName);
//     }
//   });

//   // Helper to render specific grid cells
//   const renderPlatform = (id) => {
//     const occupants = platformOccupants[id] || [];
//     const collision = occupants.length > 1;
//     const successfulScorer = occupants.find(p => scores_awarded[p] !== undefined);
//     const scored = occupants.length === 1 && successfulScorer;

//     return (
//       <Platform 
//         id={id} 
//         score={platform_scores[id]} 
//         playersOnPlatform={occupants}
//         isCollision={collision}
//         isScored={!!scored}
//       />
//     );
//   };

//   // Helper to render Player Home Bases
//   const renderHome = (direction) => {
//     const playerName = players_map[direction];
//     const move = player_move[playerName];
//     const displayMove = move === 'CENTER' ? 'CTR' : move;
    
//     // Styling based on direction for visual variety
//     let accentColor = "bg-slate-500";
//     if (direction === 'NORTH') accentColor = "bg-rose-500";
//     if (direction === 'SOUTH') accentColor = "bg-blue-500";
//     if (direction === 'EAST') accentColor = "bg-emerald-500";
//     if (direction === 'WEST') accentColor = "bg-amber-500";

//     return (
//       <div className="flex flex-col items-center justify-center w-full h-full relative group min-h-[90px]">
//         {/* Connection Line Visual */}
//         <div className={`absolute w-0.5 h-1/2 ${direction === 'NORTH' ? 'top-1/2' : direction === 'SOUTH' ? 'bottom-1/2' : 'h-0.5 w-1/2'} ${direction === 'WEST' ? 'left-1/2' : direction === 'EAST' ? 'right-1/2' : ''} bg-slate-200 -z-10`} />

//         {/* The Card */}
//         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 w-full max-w-full md:max-w-[180px] lg:max-w-full flex flex-col items-center relative overflow-hidden transition-all hover:shadow-md">
//           {/* Color Strip */}
//           <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor}`} />
          
//           <div className="text-[9px] font-bold text-slate-400 tracking-widest mb-2 mt-1">{direction}</div>
          
//           <div className="flex items-center gap-2 w-full mb-2 px-1">
//             {/* Player Avatar with Specific Color */}
//             <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white shadow-sm ${getPlayerColor(playerName)}`}>
//                <span className="text-xs font-bold">{playerName.substring(0, 2).toUpperCase()}</span>
//             </div>
            
//             <div className="flex-1 min-w-0">
//               <div className="text-[10px] font-semibold text-slate-700 truncate" title={playerName}>
//                 {playerName}
//               </div>
//               <div className="text-[9px] text-slate-400">Bot Agent</div>
//             </div>
//           </div>

//           {/* Move Indicator */}
//           <div className="w-full bg-slate-50 rounded border border-slate-100 py-1 px-2 flex items-center justify-between">
//             <span className="text-[8px] text-slate-400 font-bold uppercase">Action</span>
//             <span className={`text-[10px] font-bold ${move === 'CENTER' ? 'text-purple-600' : 'text-slate-700'}`}>
//               {displayMove}
//             </span>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="grid grid-cols-3 grid-rows-3 gap-2 md:gap-4 w-full h-full p-4 md:p-6 bg-white rounded-3xl border border-slate-100 shadow-xl relative overflow-hidden">
      
//       {/* Subtle Grid Pattern Background */}
//       <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ 
//         backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
//         backgroundSize: '20px 20px'
//       }}></div>

//       {/* Row 1 */}
//       <div className="flex justify-center items-center z-10 w-full h-full">{renderPlatform('NW')}</div>
//       <div className="flex justify-center items-center z-10 w-full h-full">{renderHome('NORTH')}</div>
//       <div className="flex justify-center items-center z-10 w-full h-full">{renderPlatform('NE')}</div>

//       {/* Row 2 */}
//       <div className="flex justify-center items-center z-10 w-full h-full">{renderHome('WEST')}</div>
//       <div className="flex justify-center items-center z-10 w-full h-full">{renderPlatform('CENTER')}</div>
//       <div className="flex justify-center items-center z-10 w-full h-full">{renderHome('EAST')}</div>

//       {/* Row 3 */}
//       <div className="flex justify-center items-center z-10 w-full h-full">{renderPlatform('SW')}</div>
//       <div className="flex justify-center items-center z-10 w-full h-full">{renderHome('SOUTH')}</div>
//       <div className="flex justify-center items-center z-10 w-full h-full">{renderPlatform('SE')}</div>
//     </div>
//   );
// };

// // --- Main Application ---

// export default function SolitudeScrambleApp() {
//   const [gameData, setGameData] = useState(INITIAL_SAMPLE_DATA);
//   const [matchIds, setMatchIds] = useState([]);
//   const [currentMatchId, setCurrentMatchId] = useState('');
//   const [turnIndex, setTurnIndex] = useState(0); // 0 to 9
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms per turn
//   const [leaderboardMode, setLeaderboardMode] = useState('match'); // 'match' or 'global'
//   const fileInputRef = useRef(null);

//   // Initialize match list when data changes
//   useEffect(() => {
//     if (gameData && gameData.matches) {
//       const ids = Object.keys(gameData.matches);
//       setMatchIds(ids);
//       if (ids.length > 0 && !ids.includes(currentMatchId)) {
//         setCurrentMatchId(ids[0]);
//         setTurnIndex(0);
//         setIsPlaying(false);
//       }
//     }
//   }, [gameData]);

//   // Playback Loop
//   useEffect(() => {
//     let interval;
//     if (isPlaying) {
//       interval = setInterval(() => {
//         setTurnIndex(prev => {
//           if (prev >= 9) {
//             setIsPlaying(false);
//             return 9;
//           }
//           return prev + 1;
//         });
//       }, playbackSpeed);
//     }
//     return () => clearInterval(interval);
//   }, [isPlaying, playbackSpeed]);

//   // Handlers
//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       try {
//         const json = JSON.parse(event.target.result);
//         if (json.matches) {
//           setGameData(json);
//         } else {
//           alert("Invalid JSON structure. Expected 'matches' key at root.");
//         }
//       } catch (err) {
//         alert("Failed to parse JSON.");
//       }
//     };
//     reader.readAsText(file);
//   };

//   const handleMatchChange = (e) => {
//     setCurrentMatchId(e.target.value);
//     setTurnIndex(0);
//     setIsPlaying(false);
//   };

//   // Derived State for Current View
//   const currentMatch = gameData?.matches?.[currentMatchId];
//   const currentTurnData = currentMatch?.turn_data?.[turnIndex];
//   const isLoaded = !!currentTurnData;

//   // Calculate Cumulative Scores up to current turn
//   const cumulativeScores = useMemo(() => {
//     if (!currentMatch) return {};
//     const scores = {};
//     currentMatch.players.forEach(p => scores[p] = 0);
    
//     currentMatch.turn_data.forEach((turn, idx) => {
//       if (idx <= turnIndex) {
//         Object.entries(turn.scores_awarded).forEach(([player, pts]) => {
//           if (scores[player] !== undefined) scores[player] += pts;
//         });
//       }
//     });
//     return scores;
//   }, [currentMatch, turnIndex]);

//   // Calculate Global Stats
//   const globalStats = useMemo(() => {
//     if (!gameData || !gameData.matches) return [];
    
//     const stats = {};
    
//     Object.values(gameData.matches).forEach(match => {
//         if (match.final_scores) {
//             Object.entries(match.final_scores).forEach(([player, score]) => {
//                 if (!stats[player]) {
//                     stats[player] = { totalPoints: 0, matchesPlayed: 0 };
//                 }
//                 stats[player].totalPoints += score;
//                 stats[player].matchesPlayed += 1;
//             });
//         }
//     });

//     return Object.entries(stats).map(([name, data]) => ({
//         name,
//         totalPoints: data.totalPoints,
//         matchesPlayed: data.matchesPlayed,
//         appm: data.matchesPlayed > 0 ? (data.totalPoints / data.matchesPlayed).toFixed(2) : 0
//     })).sort((a, b) => b.totalPoints - a.totalPoints);

//   }, [gameData]);

//   return (
//     <div className="w-screen h-screen max-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 flex flex-col overflow-hidden">
//       {/* Header */}
//       <header className="bg-white border-b border-slate-200 p-3 sticky top-0 z-20 shadow-sm/50 shrink-0">
//         <div className="w-full px-4 flex flex-col md:flex-row justify-between items-center gap-4">
//           <div className="flex items-center gap-3">
//             <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
//               <Trophy className="w-5 h-5 text-white" />
//             </div>
//             <div>
//               <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Solitude Scramble</h1>
//               <p className="text-xs font-medium text-slate-500">Bot Competition Visualizer</p>
//             </div>
//           </div>
          
//           <div className="flex items-center gap-3 w-full md:w-auto">
//             <select 
//               className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none flex-1 md:w-64 shadow-sm"
//               value={currentMatchId}
//               onChange={handleMatchChange}
//             >
//               {matchIds.map(id => (
//                 <option key={id} value={id}>Match: {id}</option>
//               ))}
//             </select>
            
//             <button 
//               onClick={() => fileInputRef.current.click()}
//               className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 transition-colors shadow-sm"
//             >
//               <Upload className="w-4 h-4" />
//               <span className="hidden sm:inline">Load JSON</span>
//             </button>
//             <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json" />
//           </div>
//         </div>
//       </header>

//       {/* Main Content: Expanded to 4-column Grid */}
//       <main className="w-full flex-1 overflow-hidden p-2 md:p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        
//         {/* Left Column: Game Board & Controls (Spans 3 Columns now) */}
//         <div className="lg:col-span-3 space-y-3 flex flex-col h-full min-h-0 overflow-hidden">
//           {/* Controls */}
//           <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 shrink-0">
//             <div className="flex items-center gap-4">
//                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
//                 <button onClick={() => setTurnIndex(0)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 hover:text-indigo-600 transition-all"><RotateCcw className="w-4 h-4" /></button>
//                 <button onClick={() => setTurnIndex(Math.max(0, turnIndex - 1))} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 hover:text-indigo-600 transition-all"><SkipBack className="w-4 h-4" /></button>
//                 <button 
//                   onClick={() => setIsPlaying(!isPlaying)} 
//                   className={`p-1.5 rounded-lg flex items-center justify-center w-9 h-9 transition-all shadow-md ${isPlaying ? 'bg-amber-100 text-amber-600' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105'}`}
//                 >
//                   {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
//                 </button>
//                 <button onClick={() => setTurnIndex(Math.min(9, turnIndex + 1))} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 hover:text-indigo-600 transition-all"><SkipForward className="w-4 h-4" /></button>
//               </div>
              
//               <div className="flex flex-col">
//                 <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">TURN {turnIndex + 1} / 10</span>
//                 <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
//                   <div 
//                     className="h-full bg-indigo-500 transition-all duration-500 ease-out rounded-full"
//                     style={{ width: `${((turnIndex + 1) / 10) * 100}%` }}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
//               <Clock className="w-3.5 h-3.5 text-slate-400" />
//               <select 
//                 className="bg-transparent border-none text-xs font-semibold text-slate-600 focus:ring-0 cursor-pointer"
//                 value={playbackSpeed}
//                 onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
//               >
//                 <option value={2000}>Slow (2s)</option>
//                 <option value={1000}>Normal (1s)</option>
//                 <option value={300}>Fast (0.3s)</option>
//               </select>
//             </div>
//           </div>

//           {/* The Board */}
//           <div className="bg-slate-100/50 rounded-[2rem] p-1 border border-slate-200/60 flex-1 h-full min-h-0 overflow-hidden relative">
//             {isLoaded ? (
//               <GameBoard turnData={currentTurnData} />
//             ) : (
//               <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-slate-200">
//                 <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
//                 <p className="font-medium">Select a match or upload data to begin</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Right Column: Info & Leaderboard (1 Column) */}
//         <div className="space-y-3 flex flex-col h-full min-h-0 overflow-hidden">
          
//           {/* Legend */}
//           <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 shrink-0">
//             <p className="font-bold mb-2 text-slate-400 uppercase tracking-wider">Visual Guide</p>
//             <div className="grid grid-cols-2 gap-2">
//               <div className="flex items-center gap-2">
//                 <span className="w-3 h-3 bg-amber-50 border border-amber-400 rounded shadow-sm"></span> 
//                 <span className="text-[10px]"><strong>Gold:</strong> Scored</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <span className="w-3 h-3 bg-red-50 border border-red-300 rounded flex items-center justify-center shadow-sm">
//                     <Zap className="w-2 h-2 text-red-500" />
//                 </span> 
//                 <span className="text-[10px]"><strong>Zap:</strong> Collision</span>
//               </div>
//               <div className="flex items-center gap-2 col-span-2">
//                 <span className="w-3 h-3 bg-white border-2 border-slate-200 rounded shadow-sm"></span> 
//                 <span className="text-[10px]"><strong>Gray Border:</strong> Empty/Standard</span>
//               </div>
//             </div>
//           </div>
          
//           {/* Turn Details Card */}
//           <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex-1 min-h-[150px] flex flex-col">
//             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 shrink-0">
//               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
//               Live Activity Log
//             </h3>
//             <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar flex-1">
//               {isLoaded && Object.entries(currentTurnData.players_map).map(([direction, player]) => {
//                 const move = currentTurnData.player_move[player];
//                 const target = getTargetPlatform(direction, move);
//                 const points = currentTurnData.scores_awarded[player];
//                 const hasPoints = points !== undefined;
                
//                 return (
//                   <div key={player} className={`text-xs p-2.5 rounded-xl border transition-colors ${hasPoints ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'} flex items-center justify-between group`}>
//                     <div className="flex items-center gap-2">
//                       <div className={`w-2 h-2 rounded-full ${getPlayerColor(player)}`} />
//                       <span className="font-semibold text-slate-700 truncate max-w-[80px]">{player}</span>
//                     </div>
//                     <div className="flex items-center gap-1.5 text-slate-500 font-medium">
//                       <span className="text-[9px] uppercase">{direction}</span>
//                       <ChevronRight className="w-3 h-3 opacity-50" />
//                       <span className={hasPoints ? "text-green-600 font-bold" : ""}>{target}</span>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Leaderboard Card - WITH TABS */}
//           <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative overflow-hidden flex-1 min-h-[250px] flex flex-col">
//             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
//               <Trophy className="w-24 h-24 rotate-12" />
//             </div>
            
//             {/* Header with Tabs */}
//             <div className="flex items-center justify-between mb-4 shrink-0 relative z-10">
//                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Standings</h3>
//                <div className="flex bg-slate-100 p-1 rounded-lg">
//                   <button 
//                     onClick={() => setLeaderboardMode('match')}
//                     className={`p-1.5 rounded-md transition-all ${leaderboardMode === 'match' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
//                     title="Current Match"
//                   >
//                     <BarChart3 className="w-4 h-4" />
//                   </button>
//                   <button 
//                     onClick={() => setLeaderboardMode('global')}
//                     className={`p-1.5 rounded-md transition-all ${leaderboardMode === 'global' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
//                     title="Global Season"
//                   >
//                     <Globe className="w-4 h-4" />
//                   </button>
//                </div>
//             </div>

//             <div className="space-y-2 relative z-10 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              
//               {/* MATCH LEADERBOARD VIEW */}
//               {leaderboardMode === 'match' && isLoaded && currentMatch.players
//                 .map(p => ({ name: p, score: cumulativeScores[p] || 0 }))
//                 .sort((a, b) => b.score - a.score)
//                 .map((p, idx) => (
//                   <div key={p.name} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
//                     <div className="flex items-center gap-2.5">
//                       <div className={`w-5 h-5 flex items-center justify-center rounded-lg font-bold text-[10px] ${idx === 0 ? 'bg-yellow-400 text-yellow-900 shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
//                         {idx + 1}
//                       </div>
//                       <div className={`w-2 h-2 rounded-full ${getPlayerColor(p.name)}`}></div>
//                       <span className="text-xs font-semibold text-slate-700 truncate max-w-[100px]">{p.name}</span>
//                     </div>
//                     <div className="flex items-center gap-1">
//                       <span className="text-sm font-bold text-indigo-600">{p.score}</span>
//                       <span className="text-[9px] font-bold text-slate-400 mt-0.5">PTS</span>
//                     </div>
//                   </div>
//               ))}

//               {/* GLOBAL LEADERBOARD VIEW */}
//               {leaderboardMode === 'global' && globalStats.map((p, idx) => (
//                   <div key={p.name} className="flex items-center justify-between p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
//                     <div className="flex items-center gap-2.5">
//                       <div className={`w-5 h-5 flex items-center justify-center rounded-lg font-bold text-[10px] ${idx === 0 ? 'bg-yellow-400 text-yellow-900 shadow-sm' : 'bg-indigo-200 text-indigo-600'}`}>
//                         {idx + 1}
//                       </div>
//                       <div className={`w-2 h-2 rounded-full ${getPlayerColor(p.name)}`}></div>
//                       <span className="text-xs font-semibold text-slate-700 truncate max-w-[90px]" title={p.name}>{p.name}</span>
//                     </div>
//                     <div className="flex flex-col items-end">
//                       <div className="flex items-center gap-1">
//                         <span className="text-sm font-bold text-indigo-700">{p.totalPoints}</span>
//                         <span className="text-[8px] font-bold text-slate-400 mt-0.5">TOT</span>
//                       </div>
//                       <span className="text-[9px] text-slate-400">{p.appm} avg</span>
//                     </div>
//                   </div>
//               ))}
              
//               {leaderboardMode === 'global' && globalStats.length === 0 && (
//                 <div className="text-center text-xs text-slate-400 py-4">
//                     Load a JSON file to see global stats
//                 </div>
//               )}

//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Upload, Trophy, Clock, AlertCircle, ChevronRight, RotateCcw, Zap, Globe, BarChart3 } from 'lucide-react';

// --- Constants & Helpers ---

const CAKE_EMOJI = "🍰";

const INITIAL_SAMPLE_DATA = {
  "matches": {
    "sample_match": {
      "players": ["bot_sample_1", "bot_sample_2", "bot_sample_3", "bot_sample_4"],
      "final_scores": { "bot_sample_1": 10, "bot_sample_2": 15, "bot_sample_3": 5, "bot_sample_4": 0 },
      "turn_data": [
        {
          "turn": 1,
          "platform_scores": { "CENTER": 4, "NW": 4, "NE": 3, "SW": 3, "SE": 3 },
          "player_move": { "bot_sample_1": "CENTER", "bot_sample_2": "RIGHT", "bot_sample_3": "LEFT", "bot_sample_4": "RIGHT" },
          "scores_awarded": { "bot_sample_1": 4, "bot_sample_4": 3 },
          "players_map": { "EAST": "bot_sample_1", "NORTH": "bot_sample_2", "WEST": "bot_sample_3", "SOUTH": "bot_sample_4" }
        }
      ]
    }
  }
};

// Map Home Position + Move Command to Target Platform
const getTargetPlatform = (home, move) => {
  if (move === 'CENTER') return 'CENTER';
  
  const mapping = {
    'NORTH': { 'LEFT': 'NE', 'RIGHT': 'NW' },
    'EAST':  { 'LEFT': 'SE', 'RIGHT': 'NE' },
    'SOUTH': { 'LEFT': 'SW', 'RIGHT': 'SE' },
    'WEST':  { 'LEFT': 'NW', 'RIGHT': 'SW' }
  };

  return mapping[home]?.[move] || 'CENTER';
};

// Deterministic color generator for players
const getPlayerColor = (name) => {
  if (!name) return "bg-slate-300";
  const gradients = [
    "bg-gradient-to-br from-cyan-500 to-blue-600",
    "bg-gradient-to-br from-emerald-400 to-green-600",
    "bg-gradient-to-br from-orange-400 to-red-500",
    "bg-gradient-to-br from-fuchsia-500 to-pink-600",
    "bg-gradient-to-br from-violet-500 to-purple-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

// --- Components ---

// 1. Cake Display Component (bigger cakes)
const CakeDisplay = ({ count }) => {
  return (
    <div className="flex flex-wrap justify-center gap-1.5 max-w-[120px]">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="text-3xl md:text-4xl leading-none drop-shadow-sm select-none transition-all hover:scale-110"
          role="img"
          aria-label="cake"
        >
          {CAKE_EMOJI}
        </span>
      ))}
    </div>
  );
};

// 2. Platform Component (bigger fonts + taller card)
const Platform = ({ id, score, playersOnPlatform, isCollision, isScored }) => {
  // Styling based on state - Light Mode Optimized
  let borderColor = "border-slate-200";
  let bgColor = "bg-white";
  let shadow = "shadow-sm";
  let scoreColor = "text-slate-500";
  let labelColor = "bg-slate-100 text-slate-500 border-slate-200";

  if (isCollision) {
    borderColor = "border-red-300";
    bgColor = "bg-red-50";
    scoreColor = "text-red-400 opacity-60 decoration-line-through";
    labelColor = "bg-red-100 text-red-500 border-red-200";
    shadow = "shadow-inner";
  } else if (isScored) {
    borderColor = "border-amber-400";
    bgColor = "bg-amber-50";
    shadow = "shadow-[0_4px_15px_rgba(251,191,36,0.25)]";
    scoreColor = "text-amber-600 font-bold";
    labelColor = "bg-amber-100 text-amber-700 border-amber-200";
  }

  return (
    <div className={`relative flex flex-col items-center justify-center w-full h-full min-h-[150px] rounded-2xl border-2 ${borderColor} ${bgColor} ${shadow} transition-all duration-500`}>
      {/* Platform ID Label */}
      <div className={`absolute -top-3 px-3 py-0.5 rounded-full text-xs md:text-sm font-bold tracking-widest border uppercase ${labelColor} z-10`}>
        {id}
      </div>
      
      {/* Score / Cakes */}
      <div className={`mb-3 flex flex-col items-center z-0 ${scoreColor}`}>
        <span className="text-xs md:text-sm font-bold tracking-wider mb-1">{score} PTS</span>
        <CakeDisplay count={score} />
      </div>

      {/* Avatars on Platform */}
      <div className="flex -space-x-3 overflow-visible absolute bottom-3 transition-all duration-500 z-10">
        {playersOnPlatform.map((p, idx) => (
          <div 
            key={idx} 
            className="w-11 h-11 rounded-full bg-white border-2 border-slate-100 shadow-md flex items-center justify-center p-0.5 transform hover:-translate-y-1 transition-transform"
            title={p}
          >
            <div className={`w-full h-full rounded-full ${getPlayerColor(p)} flex items-center justify-center text-[11px] md:text-xs text-white font-bold`}>
              {p.substring(0, 2).toUpperCase()}
            </div>
          </div>
        ))}
      </div>
      
      {isCollision && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-red-100/80 p-1.5 rounded-full shadow-sm animate-bounce backdrop-blur-sm">
            <Zap className="w-8 h-8 text-red-500 fill-red-500" strokeWidth={2} />
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Main Game Board (home cards bigger fonts)
const GameBoard = ({ turnData }) => {
  if (!turnData) return <div className="h-96 flex items-center justify-center text-slate-400 font-medium">No Turn Data</div>;

  const { platform_scores, player_move, players_map, scores_awarded } = turnData;

  // Calculate where everyone went
  const platformOccupants = { CENTER: [], NW: [], NE: [], SW: [], SE: [] };
  
  Object.entries(players_map).forEach(([homeDir, playerName]) => {
    const move = player_move[playerName];
    const target = getTargetPlatform(homeDir, move);
    if (platformOccupants[target]) {
      platformOccupants[target].push(playerName);
    }
  });

  // Helper to render specific grid cells
  const renderPlatform = (id) => {
    const occupants = platformOccupants[id] || [];
    const collision = occupants.length > 1;
    const successfulScorer = occupants.find(p => scores_awarded[p] !== undefined);
    const scored = occupants.length === 1 && successfulScorer;

    return (
      <Platform 
        id={id} 
        score={platform_scores[id]} 
        playersOnPlatform={occupants}
        isCollision={collision}
        isScored={!!scored}
      />
    );
  };

  // Helper to render Player Home Bases (bigger fonts)
  const renderHome = (direction) => {
    const playerName = players_map[direction];
    const move = player_move[playerName];
    const displayMove = move === 'CENTER' ? 'CTR' : move;
    
    // Styling based on direction for visual variety
    let accentColor = "bg-slate-500";
    if (direction === 'NORTH') accentColor = "bg-rose-500";
    if (direction === 'SOUTH') accentColor = "bg-blue-500";
    if (direction === 'EAST') accentColor = "bg-emerald-500";
    if (direction === 'WEST') accentColor = "bg-amber-500";

    return (
      <div className="flex flex-col items-center justify-center w-full h-full relative group min-h-[110px]">
        {/* Connection Line Visual */}
        <div className={`absolute w-0.5 h-1/2 ${direction === 'NORTH' ? 'top-1/2' : direction === 'SOUTH' ? 'bottom-1/2' : 'h-0.5 w-1/2'} ${direction === 'WEST' ? 'left-1/2' : direction === 'EAST' ? 'right-1/2' : ''} bg-slate-200 -z-10`} />

        {/* The Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 w-full max-w-full md:max-w-[200px] lg:max-w-full flex flex-col items-center relative overflow-hidden transition-all hover:shadow-md">
          {/* Color Strip */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor}`} />
          
          <div className="text-sm md:text-md font-bold text-slate-400 tracking-widest mb-2 mt-2">{direction}</div>
          
          <div className="flex items-center gap-3 w-full mb-3 px-1">
            {/* Player Avatar with Specific Color */}
            <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-white shadow-sm ${getPlayerColor(playerName)}`}>
               <span className="text-sm font-bold">{playerName.substring(0, 2).toUpperCase()}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-l font-semibold text-slate-700 truncate" title={playerName}>
                {playerName}
              </div>
              {/* <div className="text-xs text-slate-400">Bot Agent</div> */}
            </div>
          </div>

          {/* Move Indicator */}
          <div className="w-full bg-slate-50 rounded border border-slate-100 py-1.5 px-3 flex items-center justify-between">
            <span className="text-[12px] md:text-xs text-slate-400 font-bold uppercase">Action</span>
            <span className={`text-sm font-bold ${move === 'CENTER' ? 'text-purple-600' : 'text-slate-700'}`}>
              {displayMove}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-2 md:gap-4 w-full h-full p-4 md:p-6 bg-white rounded-3xl border border-slate-100 shadow-xl relative overflow-hidden">
      
      {/* Subtle Grid Pattern Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ 
        backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}></div>

      {/* Row 1 */}
      <div className="flex justify-center items-center z-10 w-full h-full">{renderPlatform('NW')}</div>
      <div className="flex justify-center items-center z-10 w-full h-full">{renderHome('NORTH')}</div>
      <div className="flex justify-center items-center z-10 w-full h-full">{renderPlatform('NE')}</div>

      {/* Row 2 */}
      <div className="flex justify-center items-center z-10 w-full h-full">{renderHome('WEST')}</div>
      <div className="flex justify-center items-center z-10 w-full h-full">{renderPlatform('CENTER')}</div>
      <div className="flex justify-center items-center z-10 w-full h-full">{renderHome('EAST')}</div>

      {/* Row 3 */}
      <div className="flex justify-center items-center z-10 w-full h-full">{renderPlatform('SW')}</div>
      <div className="flex justify-center items-center z-10 w-full h-full">{renderHome('SOUTH')}</div>
      <div className="flex justify-center items-center z-10 w-full h-full">{renderPlatform('SE')}</div>
    </div>
  );
};

// --- Main Application ---

export default function SolitudeScrambleApp() {
  const [gameData, setGameData] = useState(INITIAL_SAMPLE_DATA);
  const [matchIds, setMatchIds] = useState([]);
  const [currentMatchId, setCurrentMatchId] = useState('');
  const [turnIndex, setTurnIndex] = useState(0); // 0 to 9
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms per turn
  const [leaderboardMode, setLeaderboardMode] = useState('match'); // 'match' or 'global'
  const fileInputRef = useRef(null);

  // Initialize match list when data changes
  useEffect(() => {
    if (gameData && gameData.matches) {
      const ids = Object.keys(gameData.matches);
      setMatchIds(ids);
      if (ids.length > 0 && !ids.includes(currentMatchId)) {
        setCurrentMatchId(ids[0]);
        setTurnIndex(0);
        setIsPlaying(false);
      }
    }
  }, [gameData]);

  // Playback Loop
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setTurnIndex(prev => {
          if (prev >= 9) {
            setIsPlaying(false);
            return 9;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Handlers
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (json.matches) {
          setGameData(json);
        } else {
          alert("Invalid JSON structure. Expected 'matches' key at root.");
        }
      } catch (err) {
        alert("Failed to parse JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleMatchChange = (e) => {
    setCurrentMatchId(e.target.value);
    setTurnIndex(0);
    setIsPlaying(false);
  };

  // Derived State for Current View
  const currentMatch = gameData?.matches?.[currentMatchId];
  const currentTurnData = currentMatch?.turn_data?.[turnIndex];
  const isLoaded = !!currentTurnData;

  // Calculate Cumulative Scores up to current turn
  const cumulativeScores = useMemo(() => {
    if (!currentMatch) return {};
    const scores = {};
    currentMatch.players.forEach(p => scores[p] = 0);
    
    currentMatch.turn_data.forEach((turn, idx) => {
      if (idx <= turnIndex) {
        Object.entries(turn.scores_awarded).forEach(([player, pts]) => {
          if (scores[player] !== undefined) scores[player] += pts;
        });
      }
    });
    return scores;
  }, [currentMatch, turnIndex]);

  // Calculate Global Stats
  const globalStats = useMemo(() => {
    if (!gameData || !gameData.matches) return [];
    
    const stats = {};
    
    Object.values(gameData.matches).forEach(match => {
        if (match.final_scores) {
            Object.entries(match.final_scores).forEach(([player, score]) => {
                if (!stats[player]) {
                    stats[player] = { totalPoints: 0, matchesPlayed: 0 };
                }
                stats[player].totalPoints += score;
                stats[player].matchesPlayed += 1;
            });
        }
    });

    return Object.entries(stats).map(([name, data]) => ({
        name,
        totalPoints: data.totalPoints,
        matchesPlayed: data.matchesPlayed,
        appm: data.matchesPlayed > 0 ? (data.totalPoints / data.matchesPlayed).toFixed(2) : 0
    })).sort((a, b) => b.totalPoints - a.totalPoints);

  }, [gameData]);

  return (
    <div className="w-screen h-screen max-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-3 sticky top-0 z-20 shadow-sm/50 shrink-0">
        <div className="w-full px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Solitude Scramble</h1>
              <p className="text-xs font-medium text-slate-500">Bot Competition Visualizer</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none flex-1 md:w-64 shadow-sm"
              value={currentMatchId}
              onChange={handleMatchChange}
            >
              {matchIds.map(id => (
                <option key={id} value={id}>Match: {id}</option>
              ))}
            </select>
            
            <button 
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Load JSON</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json" />
          </div>
        </div>
      </header>

      {/* Main Content: Expanded to 4-column Grid */}
      <main className="w-full flex-1 overflow-hidden p-2 md:p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Left Column: Game Board & Controls (Spans 3 Columns now) */}
        <div className="lg:col-span-3 space-y-3 flex flex-col h-full min-h-0 overflow-hidden">
          {/* Controls */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                <button onClick={() => setTurnIndex(0)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 hover:text-indigo-600 transition-all"><RotateCcw className="w-4 h-4" /></button>
                <button onClick={() => setTurnIndex(Math.max(0, turnIndex - 1))} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 hover:text-indigo-600 transition-all"><SkipBack className="w-4 h-4" /></button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)} 
                  className={`p-1.5 rounded-lg flex items-center justify-center w-9 h-9 transition-all shadow-md ${isPlaying ? 'bg-amber-100 text-amber-600' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105'}`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <button onClick={() => setTurnIndex(Math.min(9, turnIndex + 1))} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 hover:text-indigo-600 transition-all"><SkipForward className="w-4 h-4" /></button>
              </div>
              
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">TURN {turnIndex + 1} / 10</span>
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${((turnIndex + 1) / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <select 
                className="bg-transparent border-none text-xs font-semibold text-slate-600 focus:ring-0 cursor-pointer"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              >
                <option value={2000}>Slow (2s)</option>
                <option value={1000}>Normal (1s)</option>
                <option value={300}>Fast (0.3s)</option>
              </select>
            </div>
          </div>

          {/* The Board */}
          <div className="bg-slate-100/50 rounded-[2rem] p-1 border border-slate-200/60 flex-1 h-full min-h-0 overflow-hidden relative">
            {isLoaded ? (
              <GameBoard turnData={currentTurnData} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium">Select a match or upload data to begin</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Info & Leaderboard (1 Column) */}
        <div className="space-y-3 flex flex-col h-full min-h-0 overflow-hidden">
          
          {/* Legend */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-500 shrink-0">
            <p className="font-bold mb-2 text-slate-400 uppercase tracking-wider">Visual Guide</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-amber-50 border border-amber-400 rounded shadow-sm"></span> 
                <span className="text-[12px]"><strong>Gold:</strong> Scored</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-50 border border-red-300 rounded flex items-center justify-center shadow-sm">
                    <Zap className="w-2 h-2 text-red-500" />
                </span> 
                <span className="text-[12px]"><strong>Zap:</strong> Collision</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <span className="w-3 h-3 bg-white border-2 border-slate-200 rounded shadow-sm"></span> 
                <span className="text-[12px]"><strong>Gray Border:</strong> Empty/Standard</span>
              </div>
            </div>
          </div>
          
          {/* Turn Details Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex-1 min-h-[150px] flex flex-col">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 shrink-0">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Live Activity Log
            </h3>
            <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar flex-1">
              {isLoaded && Object.entries(currentTurnData.players_map).map(([direction, player]) => {
                const move = currentTurnData.player_move[player];
                const target = getTargetPlatform(direction, move);
                const points = currentTurnData.scores_awarded[player];
                const hasPoints = points !== undefined;
                
                return (
                  <div key={player} className={`text-sm p-2.5 rounded-xl border transition-colors ${hasPoints ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'} flex items-center justify-between group`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getPlayerColor(player)}`} />
                      <span className="font-semibold text-slate-700 truncate max-w-[80px]">{player}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <span className="text-[11px] uppercase">{direction}</span>
                      <ChevronRight className="w-3 h-3 opacity-50" />
                      <span className={hasPoints ? "text-green-600 font-bold" : ""}>{target}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaderboard Card - WITH TABS */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative overflow-hidden flex-1 min-h-[250px] flex flex-col">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Trophy className="w-24 h-24 rotate-12" />
            </div>
            
            {/* Header with Tabs */}
            <div className="flex items-center justify-between mb-4 shrink-0 relative z-10">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Standings</h3>
               <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setLeaderboardMode('match')}
                    className={`p-1.5 rounded-md transition-all ${leaderboardMode === 'match' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Current Match"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setLeaderboardMode('global')}
                    className={`p-1.5 rounded-md transition-all ${leaderboardMode === 'global' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Global Season"
                  >
                    <Globe className="w-4 h-4" />
                  </button>
               </div>
            </div>

            <div className="space-y-2 relative z-10 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              
              {/* MATCH LEADERBOARD VIEW */}
              {leaderboardMode === 'match' && isLoaded && currentMatch.players
                .map(p => ({ name: p, score: cumulativeScores[p] || 0 }))
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                  <div key={p.name} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 flex items-center justify-center rounded-lg font-bold text-[10px] ${idx === 0 ? 'bg-yellow-400 text-yellow-900 shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
                        {idx + 1}
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getPlayerColor(p.name)}`}></div>
                      <span className="text-sm font-semibold text-slate-700 truncate max-w-[100px]">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-indigo-600">{p.score}</span>
                      <span className="text-[11px] font-bold text-slate-400 mt-0.5">PTS</span>
                    </div>
                  </div>
              ))}

              {/* GLOBAL LEADERBOARD VIEW */}
              {leaderboardMode === 'global' && globalStats.map((p, idx) => (
                  <div key={p.name} className="flex items-center justify-between p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 flex items-center justify-center rounded-lg font-bold text-[10px] ${idx === 0 ? 'bg-yellow-400 text-yellow-900 shadow-sm' : 'bg-indigo-200 text-indigo-600'}`}>
                        {idx + 1}
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getPlayerColor(p.name)}`}></div>
                      <span className="text-sm font-semibold text-slate-700 truncate max-w-[90px]" title={p.name}>{p.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1">
                        <span className="text-l font-bold text-indigo-700">{p.totalPoints}</span>
                        <span className="text-[9px] font-bold text-slate-400 mt-0.5">TOT</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{p.appm} avg</span>
                    </div>
                  </div>
              ))}
              
              {leaderboardMode === 'global' && globalStats.length === 0 && (
                <div className="text-center text-xs text-slate-400 py-4">
                    Load a JSON file to see global stats
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
