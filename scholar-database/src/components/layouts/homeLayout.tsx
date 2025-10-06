import { FC, ReactNode } from "react";
import Image from "next/image";
import { NavBar } from "../home/nav";
import { usePathname } from "next/navigation";

type HomeLayoutProps = {
	children: ReactNode;
	onSearch?: (query: string, type: "name" | "keyword") => void;
	searchQuery?: string;
	searchType?: "name" | "keyword";
};

const HomeLayout: FC<HomeLayoutProps> = ({ children, onSearch, searchQuery, searchType }) => {
	const rows = 10;
	const columns = 15;

	const path = usePathname();

	const isTemp = path.startsWith("/temp");

	return (
		<main className="h-screen w-screen bg-gradient-to-b from-violet-gd0 to-violet-gd100 overflow-scroll relative">
			{/* <main className='h-screen w-screen bg-gradient-to-b from-violet-gd0 to-violet-gd100 overflow-hidden relative'> */}
			<div className="fixed inset-0 w-full h-full">
				{Array.from({ length: rows }, (_, rowIndex) => (
					<div
						key={rowIndex}
						className={`flex w-full h-[10%] ${
							rowIndex % 2 === 1 ? "translate-x-[3.33%]" : ""
						}`}
					>
						{Array.from({ length: columns }, (_, colIndex) => (
							<div key={colIndex} className="w-[6.67%] h-full">
								<Image
									src="/assets/bg.svg"
									alt="background pattern"
									className="object-cover"
									width={30}
									height={30}
									style={{
										width: "auto",
										height: "auto",
									}}
								/>
							</div>
						))}
					</div>
				))}
			</div>
			<div className="relative z-10 w-full h-full">
				{!isTemp && (
					<NavBar onSearch={onSearch} searchQuery={searchQuery} searchType={searchType} />
				)}
				{children}
			</div>
		</main>
	);
};

export { HomeLayout };
