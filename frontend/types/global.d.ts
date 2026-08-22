declare module '*.css';

interface Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
  webkitAudioContext?: typeof AudioContext;
}
