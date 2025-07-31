import { NextResponse } from 'next/server';
import { callAgent } from '@/app/utils/agent';
import clientPromise from '@/app/utils/mongodb';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    // Ensure client is connected
    const client = await clientPromise;
    await client.connect(); // Explicitly ensure connection
    
    const { message } = await request.json();
    
    // Fix: Await params before accessing its properties
    const resolvedParams = await params;
    
    const response = await callAgent(client, message, resolvedParams.threadId);
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}