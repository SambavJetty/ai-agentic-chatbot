import ChatBox from './ChatBox';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 colorful-gradient-background animate-gradient">
        <div className="text-4xl mb-8 text-gray-600">My HR Assistant</div>
      <ChatBox />
    </main>
  )
}
