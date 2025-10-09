import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

// Language code mapping (constant outside component)
const languageCodes = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN'
}

const VoiceAssistant = ({ onTranscript, language = 'en' }) => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  
  const recognitionRef = useRef(null)
  const synthRef = useRef(null)

  // Language code mapping (outside useEffect to avoid dependency issues)
  const languageCode = languageCodes[language] || 'en-IN'

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const SpeechSynthesis = window.speechSynthesis
    
    if (SpeechRecognition && SpeechSynthesis) {
      setIsSupported(true)
      
      // Initialize Speech Recognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = languageCode
      
      recognition.onstart = () => {
        setIsListening(true)
      }
      
      recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece
          } else {
            interimTranscript += transcriptPiece
          }
        }
        
        const currentTranscript = finalTranscript || interimTranscript
        setTranscript(currentTranscript)
        
        if (finalTranscript && onTranscript) {
          onTranscript(finalTranscript)
        }
      }
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please allow microphone access.')
        } else if (event.error === 'no-speech') {
          toast.error('No speech detected. Please try again.')
        } else {
          toast.error(`Voice recognition error: ${event.error}`)
        }
      }
      
      recognition.onend = () => {
        setIsListening(false)
      }
      
      recognitionRef.current = recognition
      synthRef.current = SpeechSynthesis
    } else {
      setIsSupported(false)
      toast.error('Voice features are not supported in your browser')
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [language, onTranscript, languageCode])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    
    try {
      setTranscript('')
      recognitionRef.current.start()
      toast.success('Listening... Speak now')
    } catch (error) {
      console.error('Error starting recognition:', error)
      toast.error('Failed to start voice recognition')
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    
    try {
      recognitionRef.current.stop()
      setIsListening(false)
    } catch (error) {
      console.error('Error stopping recognition:', error)
    }
  }, [])

  // eslint-disable-next-line no-unused-vars
  const speak = useCallback((text) => {
    if (!synthRef.current || isMuted) return
    
    // Cancel any ongoing speech
    synthRef.current.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = languageCode
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1
    
    utterance.onstart = () => {
      setIsSpeaking(true)
    }
    
    utterance.onend = () => {
      setIsSpeaking(false)
    }
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
      setIsSpeaking(false)
    }
    
    synthRef.current.speak(utterance)
  }, [languageCode, isMuted])

  const stopSpeaking = useCallback(() => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    setIsSpeaking(false)
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev
      if (newMuted) {
        stopSpeaking()
        toast.success('Voice output muted')
      } else {
        toast.success('Voice output unmuted')
      }
      return newMuted
    })
  }, [stopSpeaking])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  if (!isSupported) {
    return (
      <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          Voice features are not supported in your browser. 
          Please use Chrome, Edge, or Safari.
        </p>
      </div>
    )
  }

  return (
    <div className="voice-assistant">
      <div className="flex items-center gap-3">
        {/* Voice Input Button */}
        <button
          onClick={toggleListening}
          disabled={isSpeaking}
          className={`relative p-4 rounded-full transition-all duration-300 shadow-lg ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-blue-600 hover:bg-blue-700'
          } ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? (
            <MicOff className="h-6 w-6 text-white" />
          ) : (
            <Mic className="h-6 w-6 text-white" />
          )}
          
          {isListening && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </button>

        {/* Voice Output Toggle */}
        <button
          onClick={toggleMute}
          disabled={isListening}
          className={`p-3 rounded-full transition-all duration-300 ${
            isMuted
              ? 'bg-gray-300 hover:bg-gray-400'
              : 'bg-green-600 hover:bg-green-700'
          } ${isListening ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isMuted ? 'Unmute voice output' : 'Mute voice output'}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-white" />
          ) : (
            <Volume2 className="h-5 w-5 text-white" />
          )}
        </button>

        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-full">
            <Loader className="h-4 w-4 text-green-600 animate-spin" />
            <span className="text-sm text-green-700 font-medium">Speaking...</span>
          </div>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && isListening && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 animate-fadeIn">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">You said:</span> {transcript}
          </p>
        </div>
      )}

      {/* Helper Text */}
      <p className="mt-2 text-xs text-gray-600">
        {isListening
          ? '🎤 Listening... Speak your question'
          : '💡 Click the microphone to ask questions with your voice'}
      </p>
    </div>
  )
}

export default VoiceAssistant
