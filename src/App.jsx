import "./mockStorage.js";
import React, { useState, useEffect } from "react";
import {
  Crown,
  Users,
  Check,
  X,
  Trophy,
  Play,
  Plus,
  LogIn,
} from "lucide-react";
import questionsData from "./assets/questions_es.json";

const VerdaderosReales = () => {
  const [gameState, setGameState] = useState("menu");
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerRole, setPlayerRole] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loading, setLoading] = useState(false);

  const GENERIC_QUESTIONS = questionsData.genericas;

  const LIMIT_QUESTIONS = 15;

  useEffect(() => {
    if (
      (gameState === "lobby" || gameState === "playing") &&
      currentRoom &&
      roomCode
    ) {
      const interval = setInterval(async () => {
        await loadRoom();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState, roomCode]);

  const shuffleArray = (array) => {
    const shuffled = [...array]; // Crear una copia
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };
  const createRoom = async (mode) => {
    if (!playerName.trim()) {
      alert("Por favor ingresa tu nombre");
      return;
    }

    let questions = mode === "generic" ? shuffleArray(GENERIC_QUESTIONS) : [];
    if (LIMIT_QUESTIONS && mode === "generic") {
      questions = questions.slice(0, LIMIT_QUESTIONS);
    }

    const code = generateRoomCode();
    const room = {
      code: code,
      mode: mode,
      king: { name: playerName, id: Date.now().toString() },
      aspirants: [],
      questions: questions,
      currentQuestionIndex: 0,
      currentAnswers: [],
      status: "waiting",
      scores: {},
    };

    try {
      setLoading(true);
      await window.storage.set(`room_${code}`, JSON.stringify(room), true);
      setRoomCode(code);
      setPlayerRole("king");
      setCurrentRoom(room);
      setGameState("lobby");
    } catch (error) {
      alert("Error al crear la sala: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  const joinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      alert("Por favor ingresa tu nombre y código de sala");
      return;
    }

    try {
      setLoading(true);
      const result = await window.storage.get(
        `room_${roomCode.toUpperCase()}`,
        true,
      );

      if (!result) {
        alert("Sala no encontrada");
        return;
      }

      const room = JSON.parse(result.value);

      const aspirantId = Date.now().toString();
      const newAspirant = { name: playerName, id: aspirantId };

      if (!room.aspirants) room.aspirants = [];
      room.aspirants.push(newAspirant);
      room.scores[aspirantId] = 0;

      await window.storage.set(
        `room_${roomCode.toUpperCase()}`,
        JSON.stringify(room),
        true,
      );

      setPlayerRole("aspirant");
      setCurrentRoom(room);
      setGameState("lobby");
    } catch (error) {
      alert("Error al unirse a la sala: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  const loadRoom = async () => {
    if (!roomCode) return;

    try {
      const result = await window.storage.get(`room_${roomCode}`, true);
      if (result) {
        const room = JSON.parse(result.value);
        setCurrentRoom(room);

        if (room.status === "answering" && gameState === "lobby") {
          setGameState("playing");
        }

        if (room.status === "finished" && gameState !== "results") {
          setGameState("results");
        }
      }
    } catch (error) {
      console.error("Error loading room:", error);
    }
  };
  const startGame = async () => {
    try {
      const room = { ...currentRoom, status: "answering" };
      await window.storage.set(`room_${roomCode}`, JSON.stringify(room), true);
      setCurrentRoom(room);
      setGameState("playing");
    } catch (error) {
      alert("Error al iniciar juego: " + error.message);
    }
  };
  const submitAnswer = async (answer) => {
    const currentQuestion =
      currentRoom.questions[currentRoom.currentQuestionIndex];
    const aspirantId = currentRoom.aspirants.find(
      (a) => a.name === playerName,
    )?.id;

    const answerData = {
      aspirantId: aspirantId,
      aspirantName: playerName,
      questionId: currentQuestion.id,
      answer: answer,
      timestamp: Date.now(),
    };

    try {
      const room = { ...currentRoom };
      if (!room.currentAnswers) room.currentAnswers = [];

      const existingIndex = room.currentAnswers.findIndex(
        (a) => a.aspirantId === aspirantId,
      );
      if (existingIndex >= 0) {
        room.currentAnswers[existingIndex] = answerData;
      } else {
        room.currentAnswers.push(answerData);
      }

      await window.storage.set(`room_${roomCode}`, JSON.stringify(room), true);
      setCurrentRoom(room);
    } catch (error) {
      alert("Error al enviar respuesta: " + error.message);
    }
  };
  const validateAnswer = async (aspirantId, isCorrect) => {
    try {
      const room = { ...currentRoom };

      if (isCorrect) {
        room.scores[aspirantId] = (room.scores[aspirantId] || 0) + 1;
      }

      // Crear array de jugadores que ya respondieron si no existe
      if (!room.answeredAspirants) room.answeredAspirants = [];

      // Agregar este jugador a la lista de "ya respondieron"
      if (!room.answeredAspirants.includes(aspirantId)) {
        room.answeredAspirants.push(aspirantId);
      }

      // Eliminar la respuesta de la lista de pendientes
      room.currentAnswers = room.currentAnswers.filter(
        (a) => a.aspirantId !== aspirantId,
      );

      // Verificar si ya no hay respuestas pendientes (todos validados)
      if (room.currentAnswers.length === 0) {
        // Pasar automáticamente a la siguiente pregunta
        room.currentQuestionIndex++;
        room.answeredAspirants = []; // Limpiar para la nueva pregunta

        if (room.currentQuestionIndex >= room.questions.length) {
          room.status = "finished";
        }
      }

      await window.storage.set(`room_${roomCode}`, JSON.stringify(room), true);
      setCurrentRoom(room);
    } catch (error) {
      alert("Error al validar respuesta: " + error.message);
    }
  };
  const renderMenu = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-4 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Crown className="w-20 h-20 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Verdaderos Reales
          </h1>
          <p className="text-gray-600">¿Qué tan bien te conocen tus amigos?</p>
        </div>

        <input
          type="text"
          placeholder="Tu nombre"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full p-4 border-2 border-gray-300 rounded-xl mb-4 text-lg focus:border-purple-500 focus:outline-none"
        />

        <div className="space-y-3 mb-6">
          <button
            onClick={() => createRoom("generic")}
            disabled={loading}
            className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Crown className="w-6 h-6" />
            Partida Rapida (Preguntas Genéricas)
          </button>
        </div>

        <div className="border-t-2 pt-6">
          <input
            type="text"
            placeholder="Código de sala"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="w-full p-4 border-2 border-gray-300 rounded-xl mb-3 text-lg focus:border-purple-500 focus:outline-none uppercase"
            maxLength={6}
          />
          <button
            onClick={joinRoom}
            disabled={loading}
            className="w-full bg-green-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-6 h-6" />
            Unirse A la Sala
          </button>
        </div>
      </div>
    </div>
  );
  const renderLobby = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Sala de Espera
          </h2>
          <div className="bg-gray-100 rounded-xl p-4 inline-block">
            <p className="text-sm text-gray-600">Código de Sala</p>
            <p className="text-4xl font-bold text-purple-600">{roomCode}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-bold text-gray-800">El lider</p>
                <p className="text-gray-700">{currentRoom?.king?.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-100 border-2 border-blue-400 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-6 h-6 text-blue-600" />
              <p className="font-bold text-gray-800">
                Reales ({currentRoom?.aspirants?.length || 0})
              </p>
            </div>
            <div className="space-y-2">
              {currentRoom?.aspirants?.map((aspirant) => (
                <div key={aspirant.id} className="bg-white p-2 rounded-lg">
                  <p className="text-gray-700">{aspirant.name}</p>
                </div>
              ))}
              {(!currentRoom?.aspirants ||
                currentRoom.aspirants.length === 0) && (
                <p className="text-gray-500 text-sm">Esperando Reales...</p>
              )}
            </div>
          </div>
        </div>

        {playerRole === "king" && (
          <button
            onClick={startGame}
            disabled={
              !currentRoom?.aspirants || currentRoom.aspirants.length === 0
            }
            className="w-full bg-green-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-6 h-6" />
            Iniciar Juego
          </button>
        )}

        {playerRole === "aspirant" && (
          <div className="text-center text-gray-600">
            <p>Esperando que el Lider inicie el juego...</p>
          </div>
        )}
      </div>
    </div>
  );
  const renderPlaying = () => {
    if (!currentRoom) return null;

    const currentQuestion =
      currentRoom.questions[currentRoom.currentQuestionIndex];
    const aspirantId = currentRoom.aspirants?.find(
      (a) => a.name === playerName,
    )?.id;
    const myAnswer = currentRoom.currentAnswers?.find(
      (a) => a.aspirantName === playerName,
    );
    const hasAnswered =
      currentRoom.answeredAspirants?.includes(aspirantId) || myAnswer;
    const allAnswered = currentRoom.aspirants?.every((asp) =>
      currentRoom.currentAnswers?.some((ans) => ans.aspirantId === asp.id),
    );

    if (playerRole === "king") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-4">
          <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Vista del Lider
                </h2>
                <span className="text-purple-600 font-bold">
                  Pregunta {currentRoom.currentQuestionIndex + 1}/{currentRoom.questions.length}
                </span>
              </div>

              <div className="bg-purple-100 border-2 border-purple-400 rounded-xl p-4 mb-4">
                <p className="text-xl font-bold text-gray-800">
                  {currentQuestion?.text}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {currentRoom.aspirants?.map((aspirant) => (
                  <div
                    key={aspirant.id}
                    className="bg-gray-100 p-2 rounded-lg text-center"
                  >
                    <p className="text-xs font-semibold text-gray-700">
                      {aspirant.name}
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {currentRoom.scores?.[aspirant.id] || 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <h3 className="font-bold text-gray-700">Respuestas Recibidas:</h3>
              {currentRoom.currentAnswers?.map((answer) => (
                <div
                  key={answer.aspirantId}
                  className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-800">
                        {answer.aspirantName}
                      </p>
                      <p className="text-lg text-gray-700">{answer.answer}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => validateAnswer(answer.aspirantId, true)}
                        className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => validateAnswer(answer.aspirantId, false)}
                        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {(!currentRoom.currentAnswers ||
                currentRoom.currentAnswers.length === 0) && (
                <p className="text-gray-500 text-center">
                  Esperando respuestas...
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Tu Turno</h2>
              <span className="text-purple-600 font-bold">
                Pregunta {currentRoom.currentQuestionIndex + 1}/{currentRoom.questions.length}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {currentRoom.aspirants?.map((aspirant) => (
                <div
                  key={aspirant.id}
                  className={`p-2 rounded-lg text-center ${aspirant.name === playerName ? "bg-purple-200 border-2 border-purple-500" : "bg-gray-100"}`}
                >
                  <p className="text-xs font-semibold text-gray-700">
                    {aspirant.name}
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {currentRoom.scores?.[aspirant.id] || 0}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-purple-100 border-2 border-purple-400 rounded-xl p-4 mb-4">
              <p className="text-xl font-bold text-gray-800 mb-2">
                {currentQuestion?.text}
              </p>
              <p className="text-sm text-gray-600">
                Sobre: {currentRoom.king.name}
              </p>
            </div>
          </div>

          {hasAnswered ? (
            <div className="bg-green-100 border-2 border-green-400 rounded-xl p-4 text-center">
              <Check className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="font-bold text-gray-800">Respuesta Enviada</p>
              <p className="text-gray-700 mt-2">
                {myAnswer
                  ? `Tu respuesta: ${myAnswer.answer}`
                  : "Respuesta validada"}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Esperando validación del Lider...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentQuestion?.type === "multiple" &&
                currentQuestion.options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => submitAnswer(option)}
                    className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold hover:bg-purple-700 transition"
                  >
                    {option}
                  </button>
                ))}

              {currentQuestion?.type === "boolean" && (
                <>
                  <button
                    onClick={() => submitAnswer("Sí")}
                    className="w-full bg-green-600 text-white p-4 rounded-xl font-bold hover:bg-green-700 transition"
                  >
                    Sí / Verdadero
                  </button>
                  <button
                    onClick={() => submitAnswer("No")}
                    className="w-full bg-red-600 text-white p-4 rounded-xl font-bold hover:bg-red-700 transition"
                  >
                    No / Falso
                  </button>
                </>
              )}

              {currentQuestion?.type === "text" && (
                <div>
                  <input
                    type="text"
                    placeholder="Escribe tu respuesta"
                    id="textAnswer"
                    className="w-full p-4 border-2 border-gray-300 rounded-xl mb-3 text-lg focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const answer =
                        document.getElementById("textAnswer").value;
                      if (answer.trim()) {
                        submitAnswer(answer);
                      }
                    }}
                    className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold hover:bg-purple-700 transition"
                  >
                    Enviar Respuesta
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  const renderResults = () => {
    if (!currentRoom) return null;

    const sortedScores = Object.entries(currentRoom.scores || {})
      .map(([id, score]) => ({
        aspirant: currentRoom.aspirants?.find((a) => a.id === id),
        score: score,
      }))
      .sort((a, b) => b.score - a.score);

    const winner = sortedScores[0];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Trophy className="w-24 h-24 mx-auto mb-4 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              ¡Juego Terminado!
            </h1>
            {winner && (
              <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-4 mt-4">
                <p className="text-2xl font-bold text-gray-800">
                  {winner.aspirant?.name}
                </p>
                <p className="text-gray-600">
                  ¡Es quien mejor conoce al Lider!
                </p>
                <p className="text-4xl font-bold text-purple-600 mt-2">
                  {winner.score} puntos
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2 mb-6">
            <h3 className="font-bold text-gray-700 text-center mb-3">
              Tabla Final:
            </h3>
            {sortedScores.map((entry, idx) => (
              <div
                key={entry.aspirant?.id}
                className="bg-gray-100 rounded-xl p-3 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400">
                    #{idx + 1}
                  </span>
                  <span className="font-semibold text-gray-800">
                    {entry.aspirant?.name}
                  </span>
                </div>
                <span className="text-xl font-bold text-purple-600">
                  {entry.score}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setGameState("menu");
              setCurrentRoom(null);
              setRoomCode("");
              setPlayerRole(null);
            }}
            className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition"
          >
            Volver al Menú
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans">
      {gameState === "menu" && renderMenu()}
      {gameState === "lobby" && renderLobby()}
      {gameState === "playing" && renderPlaying()}
      {gameState === "results" && renderResults()}
    </div>
  );
};

export default VerdaderosReales;
