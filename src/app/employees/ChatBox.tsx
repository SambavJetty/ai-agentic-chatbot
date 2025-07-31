'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatBox() {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [threadId, setThreadId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        const userMessage: Message = { role: 'user', content: query };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setQuery('');

        try {
            const newThreadId = threadId || Date.now().toString();
            const url = `/api/chat/${newThreadId}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: query })
            });
            const data = await response.json();
            
            if (!threadId) {
                setThreadId(newThreadId);
            }
            
            const assistantMessage: Message = { 
                role: 'assistant', 
                content: data.response 
            };
            setMessages([...newMessages, assistantMessage]);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl flex flex-col gap-4 h-[calc(100vh-8rem)]">
            <div className="flex flex-col gap-4 flex-1 overflow-y-auto p-4 bg-gray-50 rounded-md">
                {messages.map((message, index) => (
                    <div 
                        key={index} 
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div 
                            className={`max-w-[80%] p-3 rounded-lg ${
                                message.role === 'user' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-white border'
                            }`}
                        >
                            {message.role === 'user' ? (
                                message.content
                            ) : (
                                <div className="prose prose-sm max-w-none">
                                    <ReactMarkdown 
                                        components={{
                                            code: ({children}) => (
                                                <code className="bg-gray-100 rounded px-1 py-0.5">{children}</code>
                                            ),
                                            ul: ({children}) => (
                                                <ul className="list-disc ml-4 my-2">{children}</ul>
                                            ),
                                            a: ({children, href}) => (
                                                <a href={href} className="text-blue-500 hover:underline">{children}</a>
                                            )
                                        }}
                                    >
                                        {message.content}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white shadow-sm p-3 rounded-md">
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSearch} className="w-full">
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about employees (e.g., 'Who are our best performing software engineers?')"
                    className="w-full p-3 border rounded-md resize-y min-h-[4rem] max-h-[10rem]"
                    rows={2}
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSearch(e);
                        }
                    }}
                />
            </form>
        </div>
    );
} 