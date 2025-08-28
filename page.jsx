import { useState, useEffect } from "react";

export default function DemoApp() {
  const [listening, setListening] = useState(false);
  const [log, setLog] = useState([]);
  const [step, setStep] = useState("start");
  const [recognition, setRecognition] = useState(null);

  // Protocol steps (Syncope only)
  const protocol = {
    start: {
      say: "Initiating syncope protocol. Is the patient supine with legs elevated?",
      options: ["yes", "no"],
      next: { yes: "check_breathing", no: "instruct_supine" },
    },
    instruct_supine: {
      say: "Lay the patient supine. Elevate legs 10–15 degrees. Is the patient breathing?",
      options: ["yes", "no", "not sure"],
      next: { yes: "check_pulse", no: "bls", "not sure": "bls" },
    },
    check_breathing: {
      say: "Is the patient breathing?",
      options: ["yes", "no", "not sure"],
      next: { yes: "check_pulse", no: "bls", "not sure": "bls" },
    },
    bls: {
      say: "Start BLS. Call for help. If no pulse, begin chest compressions at 100–120 per minute. Check carotid pulse.",
      options: ["present", "weak", "absent", "not sure"],
      next: { present: "oxygen", weak: "oxygen", absent: "bls", "not sure": "bls" },
    },
    check_pulse: {
      say: "Check carotid pulse: present, weak, absent, or not sure?",
      options: ["present", "weak", "absent", "not sure"],
      next: { present: "oxygen", weak: "oxygen", absent: "bls", "not sure": "bls" },
    },
    oxygen: {
      say: "Provide oxygen 4–6 L/min if available. Monitor until recovery.",
      options: ["ok"],
      next: { ok: "complete" },
    },
    complete: {
      say: "Protocol complete. Document episode and recovery time.",
      options: [],
      next: {},
    },
  };

  // Speak function
  const speak = (text) => {
    const synth = window.speechSynthesis;
    if (synth.speaking) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
  };

  // Handle advancing protocol
  const handleAnswer = (answer) => {
    setLog((l) => [...l, { speaker: "Dentist", text: answer }]);
    const current = protocol[step];
    const nextStep = current.next[answer.toLowerCase()] || step;
    setStep(nextStep);
    if (protocol[nextStep]) {
      speak(protocol[nextStep].say);
      setLog((l) => [...l, { speaker: "App", text: protocol[nextStep].say }]);
    }
  };

  // Setup speech recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recog = new window.webkitSpeechRecognition();
      recog.continuous = true;
      recog.interimResults = false;
      recog.lang = "en-US";
      recog.onresult = (e) => {
        const transcript = e.results[e.results.length - 1][0].transcript.trim().toLowerCase();
        setLog((l) => [...l, { speaker: "Dentist", text: transcript }]);
        handleAnswer(transcript);
      };
      setRecognition(recog);
    }
  }, []);

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setListening(true);
      // Start protocol
      speak(protocol["start"].say);
      setLog([{ speaker: "App", text: protocol["start"].say }]);
      setStep("start");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">Dental Emergency Assistant (Demo)</h1>
      <button
        className="px-6 py-3 bg-blue-600 text-white rounded-2xl shadow-md mb-6"
        onClick={startListening}
        disabled={listening}
      >
        {listening ? "Listening..." : "Start Demo"}
      </button>

      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-4">
        <h2 className="font-semibold mb-2">Conversation Log</h2>
        <div className="h-96 overflow-y-auto border p-2 rounded-lg bg-gray-50">
          {log.map((entry, idx) => (
            <div key={idx} className={entry.speaker === "App" ? "text-blue-700" : "text-gray-800"}>
              <strong>{entry.speaker}: </strong>{entry.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
