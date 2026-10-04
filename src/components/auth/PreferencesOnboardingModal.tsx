'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Compass,
  Check,
  BookOpen,
  ArrowRight,
  Layers,
  Heart,
  Bookmark,
  X,
} from 'lucide-react';
import { UserPreferences, UserProfile, updateUserPreferences } from '@/lib/auth';

interface PreferencesOnboardingModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  onComplete: (preferences: UserPreferences) => void;
  onClose?: () => void;
}

const AVAILABLE_GENRES = [
  {
    slug: 'mystery-crime',
    name: 'Mystery, Detective & Crime',
    icon: '🕵️‍♂️',
    shortDesc: 'Brilliant sleuths, clues, and whodunits',
  },
  {
    slug: 'sci-fi',
    name: 'Science Fiction & Speculative',
    icon: '🚀',
    shortDesc: 'Time paradoxes, future tech, and cosmic journeys',
  },
  {
    slug: 'philosophy',
    name: 'Philosophy, Ethics & Wisdom',
    icon: '🏛️',
    shortDesc: 'Stoic virtues, ancient ethics, and deep thought',
  },
  {
    slug: 'adventure',
    name: 'Epic Adventure & Sea Voyages',
    icon: '🧭',
    shortDesc: 'Treasure quests, nautical hazards, and expeditions',
  },
  {
    slug: 'gothic-horror',
    name: 'Gothic, Horror & Supernatural',
    icon: '🏰',
    shortDesc: 'Cursed manors, chilling suspense, and dread',
  },
  {
    slug: 'romance-society',
    name: 'Romance, Society & Manners',
    icon: '💌',
    shortDesc: 'Passionate devotion and high society wit',
  },
  {
    slug: 'history-biography',
    name: 'Historical Chronicles & Memoirs',
    icon: '📜',
    shortDesc: 'Landmark eras, memoirs, and historic moments',
  },
  {
    slug: 'childrens-ya',
    name: "Children's & YA Classics",
    icon: '✨',
    shortDesc: 'Wonderlands, coming-of-age, and timeless lore',
  },
  {
    slug: 'poetry-verse',
    name: 'Poetry, Epics & Classical Verse',
    icon: '🎭',
    shortDesc: 'Heroic epics, poetic musings, and verse',
  },
  {
    slug: 'wit-satire',
    name: 'Wit, Satire & Timeless Comedy',
    icon: '🍷',
    shortDesc: 'Sparkling comedies of manners and biting satire',
  },
];

const THEME_INTERESTS = [
  'Time Travel & Paradoxes',
  'Victorian Whodunits & Sleuths',
  'Stoicism & Ancient Wisdom',
  'Psychological Suspense',
  'Supernatural Dread & Dark Romance',
  'Sea Expeditions & Lost Worlds',
  'Drawing-Room Wit & Courting',
  'Dystopias & Political Intrigue',
  'Heroic Epics & Classical Mythology',
  'Fairy Tales, Folklore & Wonder',
  'Existential Reflections & Fate',
  'Historic Battles & Revolution',
];

const READING_GOALS = [
  {
    id: 'casual',
    label: 'Casual Explorer',
    desc: 'A few peaceful chapters on relaxing weekends',
    pace: '~1 book / month',
  },
  {
    id: 'consistent',
    label: 'Consistent Reader',
    desc: 'Regular daily reading sessions and shelf building',
    pace: '2–3 books / month',
  },
  {
    id: 'voracious',
    label: 'Voracious Bookworm',
    desc: 'Deep diving into classic literature and series',
    pace: '1+ book / week',
  },
  {
    id: 'scholar',
    label: 'Deep Scholar',
    desc: 'Annotating, cross-referencing and philosophical study',
    pace: 'Thorough & Deep',
  },
];

export default function PreferencesOnboardingModal({
  isOpen,
  user,
  onComplete,
  onClose,
}: PreferencesOnboardingModalProps) {
  const initialGenres = user?.preferences?.genres || ['sci-fi', 'mystery-crime'];
  const initialInterests = user?.preferences?.interests || ['Time Travel & Paradoxes', 'Victorian Whodunits & Sleuths'];
  const initialGoal = user?.preferences?.readingGoal || 'Consistent Reader';

  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialInterests);
  const [selectedGoal, setSelectedGoal] = useState<string>(initialGoal);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleGenre = (slug: string) => {
    setSelectedGenres((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = () => {
    setIsSubmitting(true);
    const preferences: UserPreferences = {
      genres: selectedGenres.length > 0 ? selectedGenres : ['mystery-crime', 'sci-fi'],
      interests: selectedInterests.length > 0 ? selectedInterests : ['Victorian Whodunits & Sleuths'],
      readingGoal: selectedGoal,
    };

    updateUserPreferences(preferences);
    setIsSubmitting(false);
    onComplete(preferences);
  };

  const handleSkip = () => {
    const defaultPreferences: UserPreferences = {
      genres: ['mystery-crime', 'sci-fi', 'philosophy'],
      interests: ['Time Travel & Paradoxes', 'Stoicism & Ancient Wisdom'],
      readingGoal: 'Consistent Reader',
    };
    updateUserPreferences(defaultPreferences);
    onComplete(defaultPreferences);
  };

  return (
    <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center p-3 sm:p-6 bg-stone-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative z-10 flex flex-col w-full max-w-4xl max-h-[90vh] rounded-3xl border border-[#E5DDD0] bg-[#FAF7F2] text-[#1C1917] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5DDD0] bg-white/95 flex-none">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700/10 text-teal-800 border border-teal-700/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold tracking-tight text-stone-900">
                  Curate Your Literary Tastes
                </h2>
                <span className="rounded-full bg-teal-700/10 px-2 py-0.5 text-[11px] font-semibold text-teal-800 border border-teal-700/20">
                  Personalization
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                {user?.name ? `Welcome, ${user.name}! ` : ''}
                Tell us what you love to read so our recommendation engine can tailor your shelves.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Section 1: Favorite Genres */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-white text-xs font-bold">1</span>
                  Select Your Favorite Genres
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Pick the categories that fascinate you most ({selectedGenres.length} selected)
                </p>
              </div>
              <span className="text-xs font-medium text-teal-800 bg-teal-700/10 px-2.5 py-1 rounded-full border border-teal-700/20">
                Multi-select
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {AVAILABLE_GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(genre.slug);
                return (
                  <button
                    key={genre.slug}
                    type="button"
                    onClick={() => toggleGenre(genre.slug)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-800 shadow-md shadow-teal-700/20 transform -translate-y-0.5'
                        : 'bg-white text-stone-800 border-[#E5DDD0] hover:border-teal-600 hover:bg-[#FFFDF9]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xl">{genre.icon}</span>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <span className={`font-serif font-bold text-xs line-clamp-1 ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                      {genre.name}
                    </span>
                    <span className={`text-[10px] mt-1 line-clamp-2 ${isSelected ? 'text-teal-100' : 'text-stone-500'}`}>
                      {genre.shortDesc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Specific Interests & Themes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-white text-xs font-bold">2</span>
                  Themes &amp; Story Elements
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Select key themes to fine-tune content matching ({selectedInterests.length} selected)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {THEME_INTERESTS.map((theme) => {
                const isSelected = selectedInterests.includes(theme);
                return (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => toggleInterest(theme)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-white font-semibold shadow-xs border border-amber-700'
                        : 'bg-white text-stone-700 border border-[#E5DDD0] hover:border-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    <span>{theme}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Reading Goal */}
          <div>
            <div className="mb-3">
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-white text-xs font-bold">3</span>
                Reading Pace &amp; Ambition
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Helps us pace book suggestions and shelf recommendations
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {READING_GOALS.map((goal) => {
                const isSelected = selectedGoal === goal.label;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setSelectedGoal(goal.label)}
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                        : 'bg-white text-stone-800 border-[#E5DDD0] hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`font-serif font-bold text-xs ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                        {goal.label}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-teal-400" />}
                    </div>
                    <span className={`text-[11px] mb-2 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                      {goal.desc}
                    </span>
                    <span className={`mt-auto text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block w-fit ${
                      isSelected ? 'bg-stone-800 text-teal-300' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {goal.pace}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5DDD0] bg-white/95 flex-none">
          <div className="text-xs text-stone-600">
            <span className="font-semibold text-stone-900">{selectedGenres.length} Genres</span>
            {' · '}
            <span className="font-semibold text-stone-900">{selectedInterests.length} Interests</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 px-3 py-2 cursor-pointer transition-colors"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-teal-700/20 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <span>Save &amp; Personalize Library</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
