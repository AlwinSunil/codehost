export default function Footer() {
  return (
    <footer className="absolute bottom-0 mt-auto flex w-screen flex-col items-center justify-center gap-2 border-t bg-white px-4 py-4 md:px-10">
      <span className="text-sm font-medium text-gray-700">
        Made with ❤️ by{" "}
        <a
          href="https://alwinsunil.in"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Alwin
        </a>
      </span>
    </footer>
  );
}
