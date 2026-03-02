'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/AuthContext'; // Corrected Path
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, FileDown, Rocket, Info, Loader2, LogOut } from 'lucide-react';

export default function ATSCheckerPage() {
    const { isAdmin, isLoading: isAuthLoading, authFetch, signOut } = useAuth();
    const router = useRouter();

    const [jobDescription, setJobDescription] = useState('');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [suggestions, setSuggestions] = useState('');
    const [parsedResume, setParsedResume] = useState('');
    const [refinedResume, setRefinedResume] = useState('');

    const [isParsing, setIsParsing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

    const [parseError, setParseError] = useState<string | null>(null);
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [refineError, setRefineError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthLoading && !isAdmin) {
            router.push('/auth?callbackUrl=/ats-checker');
        }
    }, [isAdmin, isAuthLoading, router]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setResumeFile(event.target.files[0]);
        }
    };

    const handleParseResume = async () => {
        if (!resumeFile) {
            setParseError('Please upload a resume file first.');
            return;
        }
        setIsParsing(true);
        setParseError(null);
        setParsedResume('');
        const formData = new FormData();
        formData.append('resume', resumeFile);
        try {
            const response = await fetch('/api/parse-resume', { method: 'POST', body: formData });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to parse resume.');
            }
            const data = await response.json();
            setParsedResume(data.resumeText);
        } catch (err: any) {
            setParseError(err.message);
            console.error('Error parsing resume:', err);
        } finally {
            setIsParsing(false);
        }
    };

    const handleGenerate = async () => {
        if (!jobDescription || !resumeFile) {
            setGenerateError('Please provide both a job description and a resume file.');
            return;
        }
        setIsGenerating(true);
        setGenerateError(null);
        setSuggestions('');
        const formData = new FormData();
        formData.append('jobDescription', jobDescription);
        formData.append('resume', resumeFile);
        try {
            const response = await authFetch('/api/ats-checker', {
                method: 'POST',
                body: formData,
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(text || 'Failed to generate suggestions.');
            }
            setSuggestions(text);
        } catch (err: any) {
            setGenerateError(`An error occurred: ${err.message}`);
            console.error('Error generating suggestions:', err);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleRefineResume = async () => {
        if (!jobDescription || !resumeFile) {
            setRefineError('Job description and resume are required.');
            return;
        }
        setIsRefining(true);
        setRefineError(null);
        setRefinedResume('');
        const formData = new FormData();
        formData.append('jobDescription', jobDescription);
        formData.append('resume', resumeFile);
        try {
            const response = await authFetch('/api/generate-resume', {
                method: 'POST',
                body: formData,
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(text || 'Failed to generate refined resume.');
            }
            setRefinedResume(text);
        } catch (err: any) {
            setRefineError(`An error occurred: ${err.message}`);
            console.error('Error refining resume:', err);
        } finally {
            setIsRefining(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!refinedResume) return;
        setIsDownloading(true);
        try {
            const response = await fetch('/api/download-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ resumeText: refinedResume }),
            });
            if (!response.ok) {
                throw new Error('Failed to download PDF.');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Refined_Resume.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Error downloading PDF:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadDocx = async () => {
        if (!refinedResume) return;
        setIsDownloadingDocx(true);
        try {
            const response = await fetch('/api/download-docx', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ resumeText: refinedResume }),
            });
            if (!response.ok) {
                throw new Error('Failed to download DOCX.');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Refined_Resume.docx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Error downloading DOCX:', error);
        } finally {
            setIsDownloadingDocx(false);
        }
    };

    if (isAuthLoading || !isAdmin) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 pt-24 md:pt-32">
            <header className="flex justify-between items-center mb-12">
                <h1 className="text-3xl font-bold">ATS Resume Checker</h1>
                 <Button variant="outline" onClick={() => { signOut(); router.push("/"); }}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
            </header>

            <div className="max-w-4xl mx-auto space-y-8">
                {/* Section 1: Resume Processing */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Your Resume</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-4">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".pdf,.docx"
                                    className="hidden"
                                    id="resume-upload"
                                />
                                <label
                                    htmlFor="resume-upload"
                                    className="flex items-center space-x-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors"
                                >
                                    <Upload className="h-5 w-5" />
                                    <span>{resumeFile ? 'File Selected' : 'Upload .pdf or .docx'}</span>
                                </label>
                                {resumeFile && <p className="text-sm text-muted-foreground truncate">{resumeFile.name}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Button onClick={handleParseResume} disabled={isParsing || !resumeFile} className="w-full md:w-auto">
                        {isParsing ? 'Parsing...' : 'Show Parsed Resume'}
                    </Button>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Parsed Resume Content</CardTitle>
                        </CardHeader>
                        <CardContent className="min-h-[150px]">
                            {isParsing && <p>Parsing your resume...</p>}
                            {parseError && <p className="text-red-500 whitespace-pre-wrap">{parseError}</p>}
                            {parsedResume && (
                                <pre className="whitespace-pre-wrap text-sm text-muted-foreground p-4 bg-muted rounded-md font-sans">
                                    {parsedResume}
                                </pre>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Section 2: Job Description & Suggestions */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Job Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Paste the job description here..."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                className="h-48"
                            />
                        </CardContent>
                    </Card>

                    <Button onClick={handleGenerate} disabled={isGenerating || !jobDescription || !resumeFile} className="w-full md:w-auto">
                        {isGenerating ? 'Analyzing...' : 'Generate Suggestions'}
                    </Button>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Suggestions</CardTitle>
                        </CardHeader>
                        <CardContent className="min-h-[150px]">
                            {isGenerating && <p>Generating feedback...</p>}
                            {generateError && <p className="text-red-500 whitespace-pre-wrap">{generateError}</p>}
                            {suggestions && (
                                <pre className="whitespace-pre-wrap text-sm font-sans">{suggestions}</pre>
                            )}
                        </CardContent>
                    </Card>
                </div>
                
                {/* Section 3: Refined Resume */}
                {suggestions && (
                    <div className="space-y-4">
                        <Button onClick={handleRefineResume} disabled={isRefining} className="w-full md:w-auto">
                             <Rocket className="mr-2 h-4 w-4" /> {isRefining ? 'Generating...' : 'Generate Refined Resume'}
                        </Button>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold">Refined Resume</CardTitle>
                            </CardHeader>
                            <CardContent className="min-h-[300px]">
                                {isRefining && <p>Generating your new resume...</p>}
                                {refineError && <p className="text-red-500 whitespace-pre-wrap">{refineError}</p>}
                                {refinedResume && (
                                    <>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <Button 
                                                onClick={handleDownloadPdf} 
                                                disabled={isDownloading}
                                                className="w-full sm:w-auto"
                                            >
                                                {isDownloading ? 'Downloading PDF...' : <><FileDown className="mr-2 h-4 w-4" /> Download as PDF</>}
                                            </Button>
                                            <Button 
                                                onClick={handleDownloadDocx} 
                                                disabled={isDownloadingDocx}
                                                className="w-full sm:w-auto"
                                            >
                                                {isDownloadingDocx ? 'Downloading DOCX...' : <><FileDown className="mr-2 h-4 w-4" /> Download as DOCX</>}
                                            </Button>
                                        </div>
                                        <pre className="whitespace-pre-wrap text-sm font-sans p-4 bg-muted rounded-md">
                                            {refinedResume}
                                        </pre>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}