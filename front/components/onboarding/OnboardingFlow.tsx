'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Define the structure for a single question
interface Question {
    id: string;
    text: string;
    placeholder: string;
}

// Props for our component
interface OnboardingFlowProps {
    userId: string;
    questions: Question[];
    // The onComplete callback now passes the initial agent response!
    onComplete: (initialResponse: { response_text: string; events: any[] }) => void;
}

// Zod schema for validating one answer at a time
const FormSchema = z.object({
    answer: z.string().min(2, { message: "Please provide a bit more detail." }),
});

export function OnboardingFlow({ userId, questions, onComplete }: OnboardingFlowProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: { answer: "" },
    });

    const currentQuestion = questions[currentQuestionIndex];

    const onSubmit = (data: z.infer<typeof FormSchema>) => {
        // Record the answer
        const newAnswers = { ...answers, [currentQuestion.id]: data.answer };
        setAnswers(newAnswers);
        form.reset();

        // Check if we are on the last question
        if (currentQuestionIndex === questions.length - 1) {
            submitFinalAnswers(newAnswers);
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const submitFinalAnswers = async (finalAnswers: Record<string, string>) => {
        setIsLoading(true);
        try {
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/onboarding/submit`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, answers: finalAnswers }),
            });
            const initialAgentResponse = await response.json();
            if (!response.ok) throw new Error("Failed to get initial suggestions");

            // Call the magic onComplete function
            onComplete(initialAgentResponse);

        } catch (error) {
            console.error("Onboarding submission failed:", error);
            // You could show an error state here
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-muted/20">
            <Card className="w-[550px]">
                <CardHeader>
                    <CardTitle>Welcome! Let's create your profile.</CardTitle>
                    <CardDescription>{currentQuestion.text}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="answer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea
                                                placeholder={currentQuestion.placeholder}
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading}>
                                {currentQuestionIndex === questions.length - 1 ? 'Finish & Find Events' : 'Next'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}