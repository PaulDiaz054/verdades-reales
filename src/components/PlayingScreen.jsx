import { Check, X } from "lucide-react";

const PlayingScreen = ({
  currentRoom,
  playerRole,
  playerName,
  submitAnswer,
  validateAnswer,
}) => {
  if (!currentRoom) return null;

  const currentQuestion =
    currentRoom.questions[currentRoom.currentQuestionIndex];
  const aspirantId = currentRoom.aspirants?.find(
    (a) => a.name === playerName
  )?.id;
  const myAnswer = currentRoom.currentAnswers?.find(
    (a) => a.aspirantName === playerName
  );
  const hasAnswered =
    currentRoom.answeredAspirants?.includes(aspirantId) || myAnswer;

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
                Pregunta {currentRoom.currentQuestionIndex + 1}/
                {currentRoom.questions.length}
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
              Pregunta {currentRoom.currentQuestionIndex + 1}/
              {currentRoom.questions.length}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {currentRoom.aspirants?.map((aspirant) => (
              <div
                key={aspirant.id}
                className={`p-2 rounded-lg text-center ${
                  aspirant.name === playerName
                    ? "bg-purple-200 border-2 border-purple-500"
                    : "bg-gray-100"
                }`}
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
              {myAnswer ? `Tu respuesta: ${myAnswer.answer}` : "Respuesta validada"}
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
                    const answer = document.getElementById("textAnswer").value;
                    if (answer.trim()) submitAnswer(answer);
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

export default PlayingScreen;