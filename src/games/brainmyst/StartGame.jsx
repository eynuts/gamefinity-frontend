// src/games/brainmyst/StartGame.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db } from "../../firebase";
import { ref, get, push, set, update, onValue, remove } from "firebase/database";
import "./StartGame.css";
import background from "../../assets/brainmyst/bg.png";

export default function StartGame({ user, onBack, onExit, onGameStart }) {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [playersCount, setPlayersCount] = useState(0);
  const [customGameMode, setCustomGameMode] = useState(null); // 'create', 'join', or 'options'
  const [joinCode, setJoinCode] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isCreator, setIsCreator] = useState(false);

  // ================= ENTER GAME (MATCHMAKING) =================
  const handleEnterGame = async () => {
    if (!selectedSubject || !user) return;

    const roomsRef = ref(db, "brainmyst/rooms");
    const snapshot = await get(roomsRef);

    let joinedRoomId = null;

    if (snapshot.exists()) {
      const rooms = snapshot.val();
      for (const id in rooms) {
        const room = rooms[id];
        const count = room.players ? Object.keys(room.players).length : 0;
        if (room.status === "waiting" && room.subject === selectedSubject && count < 4) {
          joinedRoomId = id;
          break;
        }
      }
    }

    if (joinedRoomId) {
      await update(ref(db, `brainmyst/rooms/${joinedRoomId}/players/${user.uid}`), {
        name: user.displayName || "Player",
        alive: true,
      });
      setRoomId(joinedRoomId);
      setIsCreator(false);
      return;
    }

    const newRoomRef = push(ref(db, "brainmyst/rooms"));
    await set(newRoomRef, {
      subject: selectedSubject,
      status: "waiting",
      createdAt: Date.now(),
      players: {
        [user.uid]: {
          name: user.displayName || "Player",
          alive: true,
        },
      },
    });
    setRoomId(newRoomRef.key);
    setIsCreator(true);
  };

  // ================= CUSTOM GAME LOBBY =================
  const generateRoomCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleCreateLobby = async () => {
    if (!selectedSubject || !user) return;

    const code = generateRoomCode();
    setRoomCode(code);

    const newRoomRef = push(ref(db, "brainmyst/rooms"));
    await set(newRoomRef, {
      subject: selectedSubject,
      status: "waiting",
      roomCode: code,
      createdAt: Date.now(),
      players: {
        [user.uid]: { name: user.displayName || "Player", alive: true },
      },
    });
    setRoomId(newRoomRef.key);
    setCustomGameMode("create");
    setIsCreator(true);
  };

  const handleJoinLobby = async () => {
    if (!joinCode || !selectedSubject || !user) return;

    const roomsRef = ref(db, "brainmyst/rooms");
    const snapshot = await get(roomsRef);

    if (snapshot.exists()) {
      const rooms = snapshot.val();
      for (const id in rooms) {
        const room = rooms[id];
        const count = room.players ? Object.keys(room.players).length : 0;
        if (
          room.status === "waiting" &&
          room.roomCode === joinCode &&
          count < 4
        ) {
          await update(ref(db, `brainmyst/rooms/${id}/players/${user.uid}`), {
            name: user.displayName || "Player",
            alive: true,
          });
          setRoomId(id);
          setRoomCode(joinCode);
          setCustomGameMode("join");
          setIsCreator(false);
          return;
        }
      }
      alert("Invalid room code or room is full");
    }
  };

  // ================= LISTEN TO ROOM =================
  useEffect(() => {
    if (!roomId) return;

    const roomRef = ref(db, `brainmyst/rooms/${roomId}`);

    const unsubscribe = onValue(roomRef, async (snapshot) => {
        if (!snapshot.exists()) {
            // room was deleted → go back to menu
            setRoomId(null);
            setCustomGameMode(null);
            setRoomCode("");
            setJoinCode("");
            setPlayersCount(0);
            setIsCreator(false);
            return;
          }
          

      const data = snapshot.val();
      const players = data.players || {};
      const playerIds = Object.keys(players);

      setPlayersCount(playerIds.length);

      if (data.status === "playing") {
        onGameStart(roomId);
        return;
      }

      if (playerIds.length === 4 && data.status === "waiting") {
        const spyId = playerIds[Math.floor(Math.random() * playerIds.length)];
        const topics = {
            Math: [
              "Algebra", "Linear Equations", "Quadratic Equations", "Polynomials", "Factoring", "Functions", "Graphs of Functions", "Inequalities",
              "Systems of Equations", "Sequences", "Patterns", "Probability", "Statistics", "Mean, Median, Mode", "Range", "Ratio and Proportion",
              "Percentages", "Exponents", "Radicals", "Logarithms", "Trigonometry Basics", "Sine", "Cosine", "Tangent", "Angles", "Pythagorean Theorem",
              "Coordinate Geometry", "Slope", "Distance Formula", "Midpoint Formula", "Circle Equations", "Area of Triangle", "Area of Circle",
              "Perimeter", "Surface Area", "Volume", "Probability of Events", "Permutations", "Combinations", "Venn Diagrams", "Simple Interest",
              "Compound Interest", "Rates and Ratios", "Word Problems", "Algebraic Expressions", "Factorization", "Linear Functions", "Quadratic Functions",
              "Graphs of Lines", "Parallel Lines", "Triangles Properties", "Circle Properties", "Angles in Polygons", "Volume of Cylinder", "Volume of Sphere",
              "Surface Area of Cube", "Surface Area of Rectangular Prism", "Slope-Intercept Form", "Function Notation", "Direct and Inverse Variation",
              "Exponential Growth", "Exponential Decay", "Simple Equations", "Quadratic Formula", "Discriminant", "Factor Theorem", "Remainder Theorem",
              "Arithmetic Sequence", "Geometric Sequence", "Probability Tree Diagram", "Sample Space", "Random Variable", "Standard Deviation",
              "Bar Graphs", "Histograms", "Pie Charts", "Circle Graphs", "Coordinate Plane", "Parallel and Perpendicular Lines", "Angle Sum Property",
              "Congruent Triangles", "Similar Triangles", "Trapezoid Properties", "Parallelogram Properties", "Rectangle Properties", "Square Properties",
              "Polygon Angles", "Circle Circumference", "Circle Area", "Volume of Cone", "Volume of Pyramid", "Surface Area of Sphere"
            ],
          
            Science: [
              "Atoms and Molecules", "States of Matter", "Mixtures and Compounds", "Acids and Bases", "Photosynthesis", "Respiration", "Gravity", "Motion",
              "Force and Pressure", "Work and Energy", "Simple Machines", "Electricity Basics", "Circuits", "Magnetism", "Heat and Temperature", "Light and Reflection",
              "Refraction", "Sound Waves", "The Human Heart", "The Human Brain", "Digestive System", "Respiratory System", "Nervous System", "Skeletal System",
              "Muscular System", "Plant Cells", "Animal Cells", "Cell Structure", "DNA", "Genes", "Genetics", "Adaptation", "Evolution", "Ecosystem",
              "Food Chain", "Food Web", "Photosynthetic Organisms", "Pollution", "Global Warming", "Natural Resources", "Renewable Energy", "Nonrenewable Energy",
              "Solar System", "Planets", "Moons", "Sun and Stars", "Water Cycle", "Carbon Cycle", "Nitrogen Cycle", "Weather", "Climate", "Rocks and Minerals",
              "Volcanoes", "Earthquakes", "Fossils", "Layers of Earth", "Soil Erosion", "Plant Reproduction", "Animal Reproduction", "Immune System", "Diseases",
              "Bacteria", "Viruses", "Vaccines", "Human Senses", "Reflexes", "Magnetic Field", "Electric Current", "Circuit Components", "Conductors", "Insulators",
              "Photosynthesis Light Reaction", "Photosynthesis Dark Reaction", "Cell Division Mitosis", "Cell Division Meiosis", "Food Preservation", "Nutrition",
              "Digestive Enzymes", "Human Skeleton", "Muscle Types", "Respiratory Organs", "Oxygen Transport", "Blood Components", "Climate Change Effects",
              "Renewable vs Nonrenewable Energy", "Solar Energy", "Wind Energy", "Hydropower", "Geothermal Energy", "Friction", "Pressure in Fluids",
              "Density", "Buoyancy", "Momentum", "Newton's Laws", "Energy Transfer", "Kinetic Energy", "Potential Energy", "Work Done", "Power", "Simple Machines"
            ],
          
            History: [
              "Philippine Revolution", "Rizal's Life", "Andres Bonifacio", "Katipunan", "Philippine-American War", "Martial Law", "People Power Revolution",
              "Spanish Colonization", "American Colonization", "Japanese Occupation", "World War II in PH", "Philippine Independence", "Jose Rizal Works",
              "National Heroes", "Lapu-Lapu", "Miguel Lopez de Legazpi", "Colonial Government", "Spanish Era Education", "Galleon Trade", "Philippine Geography",
              "Philippine Provinces", "Philippine Regions", "Philippine Culture", "Festivals in PH", "Philippine Constitution", "Barangay System", "Local Government",
              "Presidents of PH", "Marcos Era", "Aquino Administration", "Ramos Administration", "Arroyo Administration", "PNoy Administration", "Duterte Administration",
              "Martial Law Human Rights", "Philippine Economy", "Agriculture in PH", "Philippine Industries", "Philippine Folk Tales", "Philippine Literature",
              "Philippine Music", "Philippine Arts", "Philippine Dance", "Prehistoric PH", "Spanish-Filipino Wars", "Philippine Revolution Battles", "Balangiga Encounter",
              "Cavite Mutiny", "Katipunan Secrets", "Philippine Symbols", "Philippine Flags", "Philippine National Anthem", "Historical Landmarks", "Intramuros",
              "Fort Santiago", "Rizal Monument", "Old Manila", "Philippine Heroes", "Philippine Mythology", "Barangay Life", "Spanish Missions", "Churches in PH",
              "Philippine Education History", "Philippine Languages", "Philippine Geography Landforms", "Philippine Rivers", "Philippine Mountains", "Philippine Islands",
              "Philippine Seas", "Philippine Climate", "Philippine Flora", "Philippine Fauna", "Philippine Festivals", "Philippine Independence Day", "PH-American War Leaders",
              "Revolutionary Strategies", "Philippine Constitution 1935", "Philippine Constitution 1987", "Philippine Political Parties", "Philippine Elections", "Philippine Laws",
              "Philippine Government Branches", "Philippine Judiciary", "Philippine Executive", "Philippine Legislative", "Philippine Heroes Monuments", "Philippine Economy 20th Century",
              "Philippine Trade History", "Philippine Maritime History", "Philippine Archaeology", "Philippine Prehistory", "Philippine Independence Movements", "PH WWII Heroes",
              "Philippine Culture and Traditions", "Filipino Values", "Philippine Geography Cities", "Philippine Geography Regions", "Philippine Natural Disasters", "Typhoons in PH"
            ]
          };
          
        const topic =
          topics[data.subject][
            Math.floor(Math.random() * topics[data.subject].length)
          ];
        await update(roomRef, { status: "playing", spyId, topic, round: 1, currentTurn: playerIds[0] });
      }
    });

    return () => unsubscribe();
  }, [roomId, onGameStart]);

  // ================= CANCEL LOBBY =================
  const handleCancelLobby = async () => {
    if (!roomId || !user) return;
  
    if (isCreator) {
      // 🔥 Creator cancels → delete entire room (kicks everyone)
      await remove(ref(db, `brainmyst/rooms/${roomId}`));
    } else {
      // 👤 Normal player leaves
      await remove(ref(db, `brainmyst/rooms/${roomId}/players/${user.uid}`));
    }
  
    // Reset local state
    setRoomId(null);
    setCustomGameMode(null);
    setRoomCode("");
    setJoinCode("");
    setPlayersCount(0);
    setIsCreator(false);
  };
  

  // ================= RENDER =================
  return (
    <div
      className="startbrain-brain-myst-wrapper"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="startbrain-brain-myst-overlay"></div>

      <motion.div
        className="startbrain-brain-main-menu-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {!roomId ? (
          <>
            <h1 className="startbrain-brain-start-title">Select Game Mode</h1>

            <div className="startbrain-brain-subject-section">
              <p className="startbrain-brain-subject-label">Choose a Subject</p>
              <div className="startbrain-brain-subject-buttons">
                {["Math", "Science", "History"].map((subject) => (
                  <motion.button
                    key={subject}
                    className={`startbrain-brain-subject-btn ${
                      selectedSubject === subject ? "startbrain-active" : ""
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedSubject(subject)}
                  >
                    {subject}
                  </motion.button>
                ))}
              </div>
            </div>

            {!customGameMode ? (
              <div className="startbrain-brain-menu-actions">
                <motion.button
                  className="startbrain-brain-menu-btn startbrain-brain-start-btn"
                  disabled={!selectedSubject}
                  onClick={handleEnterGame}
                >
                  ENTER GAME
                </motion.button>

                <motion.button
                  className="startbrain-brain-menu-btn startbrain-brain-exit-btn"
                  disabled={!selectedSubject}
                  onClick={() => setCustomGameMode("options")}
                >
                  CUSTOM GAME
                </motion.button>
              </div>
            ) : customGameMode === "options" ? (
              <div className="custom-game-options">
                <motion.button
                  className="startbrain-brain-menu-btn startbrain-brain-start-btn"
                  onClick={handleCreateLobby}
                >
                  CREATE LOBBY
                </motion.button>
                <motion.div className="join-lobby-section">
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    maxLength={6}
                  />
                  <motion.button
                    className="startbrain-brain-menu-btn startbrain-brain-start-btn"
                    onClick={handleJoinLobby}
                  >
                    JOIN LOBBY
                  </motion.button>
                </motion.div>
              </div>
            ) : null}

            <div className="startbrain-brain-footer-actions">
              <button className="startbrain-brain-footer-btn" onClick={onBack}>
                Back to Menu
              </button>
              <button className="startbrain-brain-footer-btn" onClick={onExit}>
                Exit to Home
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="startbrain-brain-start-title">
              {customGameMode ? "Lobby" : "Finding Players…"}
            </h2>

            {roomCode && (
              <div className="lobby-code-section">
                <p>Room Code: <strong>{roomCode}</strong></p>
                <button onClick={() => navigator.clipboard.writeText(roomCode)}>Copy</button>
              </div>
            )}

            <p className="startbrain-brain-subject-label">
              {playersCount} / 4 joined
            </p>
            <div className="startbrain-loading-dots">● ● ●</div>

            {/* Cancel Button */}
            <motion.button
              className="startbrain-brain-menu-btn startbrain-brain-exit-btn"
              onClick={handleCancelLobby}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancel
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
}
