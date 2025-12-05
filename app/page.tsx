import Link from "next/link";
export default function Home() {
  return (
     <div className="flex min-h-screen flex-col items-center justify-between p-24">

      <h1 className="text-4xl font-bold">Welcome to the Barber App</h1>

      <p className="mt-4 text-lg">Find your perfect hairstyle!</p>

     

      <Link href="/suggest" className="mt-6 text-blue-500 underline">

        Browse Hairstyles

      </Link>

    </div>

  );
}
