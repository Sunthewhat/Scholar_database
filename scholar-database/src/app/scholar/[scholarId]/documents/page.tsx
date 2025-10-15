"use client";
import { AuthWrapper } from "@/components/authWrapper";
import { HomeLayout } from "@/components/layouts/homeLayout";
import { Modal } from "@/components/modal";
import { Scholar } from "@/types/scholar";
import { useApiData } from "@/utils/api";
import { Axios } from "@/util/axios";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { FC, useState } from "react";

const ScholarDocumentsPage: FC = () => {
	const router = useRouter();
	const params = useParams();
	const scholarId = params.scholarId as string;

	const [searchQuery, setSearchQuery] = useState<string>("");
	const [searchType, setSearchType] = useState<"name" | "keyword">("name");
	const [error, setError] = useState<string | null>(null);

	// Document management states
	const [showDocumentModal, setShowDocumentModal] = useState(false);
	const [documentName, setDocumentName] = useState("");
	const [documentFile, setDocumentFile] = useState<File | null>(null);
	const [isUploadingDocument, setIsUploadingDocument] = useState(false);
	const [isDeletingDocument, setIsDeletingDocument] = useState(false);

	// Fetch scholar data
	const {
		data: scholar,
		isLoading: isScholarLoading,
		isError: isScholarError,
	} = useApiData<Scholar>(`/scholar/${scholarId}`);

	const handleSearch = (query: string, type: "name" | "keyword") => {
		setSearchQuery(query);
		setSearchType(type);
	};

	const handleBackToScholar = () => {
		router.push(`/scholar/${scholarId}`);
	};

	const handleUploadDocument = async () => {
		if (!documentFile || !documentName.trim()) {
			setError("กรุณาเลือกไฟล์และระบุชื่อไฟล์");
			return;
		}

		try {
			setIsUploadingDocument(true);
			const formData = new FormData();
			formData.append("document", documentFile);
			formData.append("file_name", documentName.trim());

			const response = await Axios.post(`/scholar/${scholarId}/documents`, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			if (response.status === 200 && response.data.success) {
				// Reset form
				setDocumentName("");
				setDocumentFile(null);
				setShowDocumentModal(false);

				// Refresh scholar data to show new document
				window.location.reload();
			} else {
				setError(response.data.msg || "เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
			}
		} catch (err: any) {
			console.error("Error uploading document:", err);
			setError(err.response?.data?.msg || "เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
		} finally {
			setIsUploadingDocument(false);
		}
	};

	const handleDeleteDocument = async (documentId: string) => {
		if (!confirm("ยืนยันการลบไฟล์นี้?")) {
			return;
		}

		try {
			setIsDeletingDocument(true);
			const response = await Axios.delete(`/scholar/${scholarId}/documents/${documentId}`);

			if (response.status === 200 && response.data.success) {
				// Refresh scholar data to show updated documents
				window.location.reload();
			} else {
				setError(response.data.msg || "เกิดข้อผิดพลาดในการลบไฟล์");
			}
		} catch (err: any) {
			console.error("Error deleting document:", err);
			setError(err.response?.data?.msg || "เกิดข้อผิดพลาดในการลบไฟล์");
		} finally {
			setIsDeletingDocument(false);
		}
	};

	const handleDownloadDocument = (fileUrl: string, fileName: string) => {
		// Open the file in a new tab
		window.open(fileUrl, "_blank");
	};

	if (isScholarLoading) {
		return (
			<AuthWrapper>
				<HomeLayout>
					<div className="flex items-center justify-center h-full">
						<p>กำลังโหลด...</p>
					</div>
				</HomeLayout>
			</AuthWrapper>
		);
	}

	if (isScholarError || !scholar) {
		return (
			<AuthWrapper>
				<HomeLayout>
					<div className="flex items-center justify-center h-full">
						<p>ไม่พบข้อมูลทุนการศึกษา</p>
					</div>
				</HomeLayout>
			</AuthWrapper>
		);
	}

	return (
		<AuthWrapper>
			<HomeLayout onSearch={handleSearch} searchQuery={searchQuery} searchType={searchType}>
				<div className="w-full h-full flex flex-col mx-auto mt-24 px-6">
					{/* Header */}
					<div className="flex items-center justify-between mb-8">
						<div className="flex items-center gap-4">
							<button
								onClick={handleBackToScholar}
								className="flex items-center gap-2 text-violet-3 hover:text-violet-4 transition-colors"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
								</svg>
								<span>กลับ</span>
							</button>
							<h1 className="text-3xl font-bold text-gray-900">เอกสารที่เกี่ยวข้อง</h1>
						</div>
						<button
							onClick={() => setShowDocumentModal(true)}
							className="flex gap-2 items-center bg-violet-3 text-white px-4 py-2 rounded-xl hover:bg-blue-600"
						>
							<Image
								src="/assets/add.svg"
								alt="add"
								height={16}
								width={16}
								style={{ width: "auto", height: "auto" }}
							/>
							<span className="text-base font-semibold">เพิ่มเอกสาร</span>
						</button>
					</div>

					{error && (
						<div className="w-full mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
							{error}
						</div>
					)}

					{/* Documents Grid */}
					<div className="flex-1 overflow-y-auto">
						{scholar.documents && scholar.documents.length > 0 ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
								{scholar.documents.map((doc) => (
									<div
										key={doc.document_id}
										className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow"
									>
										<div className="flex items-start justify-between mb-3">
											<div className="flex-1 min-w-0">
												<h3 className="text-lg font-semibold text-black truncate">
													{doc.file_name}
												</h3>
												<p className="text-sm text-gray-500 mt-2">
													อัปโหลดเมื่อ:{" "}
													{new Date(doc.uploaded_at).toLocaleDateString("th-TH", {
														year: "numeric",
														month: "long",
														day: "numeric",
													})}
												</p>
											</div>
										</div>
										<div className="flex gap-2 mt-4">
											<button
												onClick={() => handleDownloadDocument(doc.file_url, doc.file_name)}
												className="flex-1 flex items-center justify-center gap-2 bg-violet-3 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors"
											>
												<Image
													src="/assets/download.svg"
													alt="download"
													height={16}
													width={16}
													style={{ width: "auto", height: "auto" }}
												/>
												<span className="text-sm font-medium">ดาวน์โหลด</span>
											</button>
											<button
												onClick={() => handleDeleteDocument(doc.document_id)}
												disabled={isDeletingDocument}
												className="flex items-center justify-center bg-red text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400"
											>
												<Image
													src="/assets/delete.svg"
													alt="delete"
													height={16}
													width={16}
													style={{
														width: "auto",
														height: "auto",
														filter: "brightness(0) saturate(100%) invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)",
													}}
												/>
											</button>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="flex items-center justify-center h-64">
								<div className="text-center">
									<svg
										className="mx-auto h-16 w-16 text-gray-400 mb-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
										/>
									</svg>
									<p className="text-xl text-gray-500 mb-2">ยังไม่มีเอกสาร</p>
									<p className="text-gray-400">กดปุ่ม &quot;เพิ่มเอกสาร&quot; เพื่อเริ่มต้น</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</HomeLayout>

			{/* Document Upload Modal */}
			<Modal
				isOpen={showDocumentModal}
				onClose={() => {
					setShowDocumentModal(false);
					setDocumentName("");
					setDocumentFile(null);
				}}
				size="md"
			>
				<div className="py-4">
					<p className="text-black font-semibold text-lg mb-6 text-center">เพิ่มเอกสาร</p>

					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							ชื่อเอกสาร
						</label>
						<input
							type="text"
							value={documentName}
							onChange={(e) => setDocumentName(e.target.value)}
							placeholder="เช่น แบบฟอร์มสมัคร, ใบเสร็จ"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-3"
						/>
					</div>

					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							ไฟล์เอกสาร
						</label>
						<input
							type="file"
							onChange={(e) => {
								const file = e.target.files?.[0];
								if (file) {
									setDocumentFile(file);
								}
							}}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-3"
						/>
						{documentFile && (
							<p className="text-sm text-gray-500 mt-2">
								ไฟล์ที่เลือก: {documentFile.name}
							</p>
						)}
					</div>

					<div className="flex gap-4 justify-center">
						<button
							onClick={() => {
								setShowDocumentModal(false);
								setDocumentName("");
								setDocumentFile(null);
							}}
							className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
						>
							ยกเลิก
						</button>
						<button
							onClick={handleUploadDocument}
							disabled={isUploadingDocument || !documentFile || !documentName.trim()}
							className={`px-6 py-2 text-white rounded-lg transition-colors ${
								isUploadingDocument || !documentFile || !documentName.trim()
									? "bg-gray-400 cursor-not-allowed"
									: "bg-violet-3 hover:bg-blue-600"
							}`}
						>
							{isUploadingDocument ? "กำลังอัปโหลด..." : "อัปโหลด"}
						</button>
					</div>
				</div>
			</Modal>
		</AuthWrapper>
	);
};

export default ScholarDocumentsPage;
