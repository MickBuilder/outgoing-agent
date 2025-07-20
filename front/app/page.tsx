'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Chat } from "@/components/chat/Chat";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

// Define the data structures again for clarity
interface Question { id: string; text: string; placeholder: string; }
interface Event { title: string; date: string; location: string; summary: string; url: string; }
interface Message { id: string; sender: 'user' | 'agent'; text: string; }

export default function HomePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [onboardingState, setOnboardingState] = useState<{
    status: 'loading' | 'pending' | 'complete';
    questions: Question[];
  }>({ status: 'loading', questions: [] });

  // New state to hold the "welcome package" from the backend
  const [initialChatData, setInitialChatData] = useState<{
    messages: Message[];
    events: Event[];
  } | null>(null);

  // Effect to check status when the app loads
  useEffect(() => {
    let currentUserId = localStorage.getItem('connector_user_id');
    if (!currentUserId) {
      currentUserId = uuidv4();
      localStorage.setItem('connector_user_id', currentUserId);
    }
    setUserId(currentUserId);

    const checkOnboardingStatus = async (id: string) => {
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/onboarding/start/${id}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        setOnboardingState({ status: data.status, questions: data.questions });
      } catch (error) {
        console.error("API connection failed", error);
        setOnboardingState({ status: 'pending', questions: [] }); // Fail safe
      }
    };

    checkOnboardingStatus(currentUserId);
  }, []);

  // The magic callback function passed to the onboarding component
  const handleOnboardingComplete = (initialResponse: { response_text: string; events: Event[] }) => {
    setInitialChatData({
      // We create a welcome message to show in the chat UI
      messages: [
        { id: uuidv4(), sender: 'agent', text: "Thanks for completing your profile! Based on what you told me, I found a few events you might like this weekend to get you started." },
        { id: uuidv4(), sender: 'agent', text: initialResponse.response_text },
      ],
      events: initialResponse.events,
    });
    setOnboardingState({ status: 'complete', questions: [] });
  };

  // Render logic
  if (onboardingState.status === 'loading' || !userId) {
    return <div className="flex h-screen w-screen items-center justify-center">Loading...</div>;
  }

  if (onboardingState.status === 'pending') {
    return <OnboardingFlow userId={userId} questions={onboardingState.questions} onComplete={handleOnboardingComplete} />;
  }

  // Pass the initial data to the Chat component
  return <Chat initialData={initialChatData} />;
}