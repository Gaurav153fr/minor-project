'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { TabsNavigation } from '@/components/TabsNavigation';
import { ChatTab } from '@/components/tabs/ChatTab';
import { QuizTab } from '@/components/tabs/QuizTab';
import { FlashcardsTab } from '@/components/tabs/FlashcardsTab';
import { MindmapTab } from '@/components/tabs/MindmapTab';
import { DocumentsTab } from '@/components/tabs/DocumentsTab';
import { DocumentModal } from '@/components/DocumentModal';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { DocumentItem, StudyTab } from '@/types';
import { StudentProfile } from '@/types/profile';
import { getProfile, buildStudentContext, isOnboardingComplete } from '@/store/profile';
import { fetchDocuments, checkBackendHealth } from '@/lib/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState<StudyTab>('chat');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>('all');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);

  // Student Profile state
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Document Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalDocId, setModalDocId] = useState<string | null>(null);
  const [modalDocTitle, setModalDocTitle] = useState<string | undefined>(undefined);

  // Load and sync student profile
  const syncProfile = useCallback(() => {
    const p = getProfile();
    setProfile(p);
    if (!p || !p.onboardingComplete) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, []);

  useEffect(() => {
    syncProfile();

    const handleProfileUpdate = () => {
      syncProfile();
    };

    window.addEventListener('studygenius-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('studygenius-profile-updated', handleProfileUpdate);
    };
  }, [syncProfile]);

  const loadDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const [docs, healthy] = await Promise.all([
        fetchDocuments().catch(() => []),
        checkBackendHealth(),
      ]);
      setDocuments(docs);
      setIsBackendConnected(healthy);
    } catch {
      setIsBackendConnected(false);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();

    // Periodic health check
    const interval = setInterval(async () => {
      const healthy = await checkBackendHealth();
      setIsBackendConnected(healthy);
    }, 15000);

    return () => clearInterval(interval);
  }, [loadDocuments]);

  const handleOpenDocumentModal = (docId: string, docTitle?: string) => {
    setModalDocId(docId);
    setModalDocTitle(docTitle);
    setIsModalOpen(true);
  };

  const studentContext = profile ? buildStudentContext(profile) : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Onboarding Overlay Modal */}
      {showOnboarding && (
        <OnboardingFlow
          onComplete={(newProfile) => {
            setProfile(newProfile);
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Header */}
      <Header
        documents={documents}
        selectedDocument={selectedDocument}
        onSelectDocument={setSelectedDocument}
        isBackendConnected={isBackendConnected}
        isLoadingDocs={isLoadingDocs}
        profile={profile}
        onOpenOnboarding={() => setShowOnboarding(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Panes */}
        <div className="flex-1 transition-all duration-300">
          {activeTab === 'chat' && (
            <ChatTab
              onOpenSourceModal={handleOpenDocumentModal}
              profile={profile}
              studentContext={studentContext}
            />
          )}

          {activeTab === 'quiz' && (
            <QuizTab
              selectedDocument={selectedDocument}
              onSwitchTab={setActiveTab}
              profile={profile}
              studentContext={studentContext}
            />
          )}

          {activeTab === 'flashcards' && (
            <FlashcardsTab
              selectedDocument={selectedDocument}
              profile={profile}
              studentContext={studentContext}
            />
          )}

          {activeTab === 'mindmap' && (
            <MindmapTab
              selectedDocument={selectedDocument}
              profile={profile}
              studentContext={studentContext}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsTab
              documents={documents}
              isLoading={isLoadingDocs}
              onRefresh={loadDocuments}
              onOpenDocumentModal={handleOpenDocumentModal}
              profile={profile}
            />
          )}
        </div>
      </main>

      {/* Document Notes Viewer Modal */}
      <DocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        documentId={modalDocId}
        documentTitle={modalDocTitle}
      />
    </div>
  );
}

