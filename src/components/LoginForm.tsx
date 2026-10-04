'use client';
import {
  memo,
  ReactNode,
  useState,
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  forwardRef,
} from 'react';
import Image from 'next/image';
import {
  motion,
  useAnimation,
  useInView,
  useMotionTemplate,
  useMotionValue,
} from 'motion/react';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== Input Component ====================

const Input = memo(
  forwardRef(function Input(
    { className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) {
    const radius = 100;
    const [visible, setVisible] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({
      currentTarget,
      clientX,
      clientY,
    }: React.MouseEvent<HTMLDivElement>) {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    return (
      <motion.div
        style={{
          background: useMotionTemplate`
        radial-gradient(
          ${visible ? radius + 'px' : '0px'} circle at ${mouseX}px ${mouseY}px,
          #3b82f6,
          transparent 80%
        )
      `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className='group/input rounded-lg p-[2px] transition duration-300 w-full'
      >
        <input
          type={type}
          className={cn(
            `shadow-input dark:placeholder-text-neutral-600 flex h-10 w-full rounded-md border-none bg-gray-50 px-3 py-2 text-sm text-black transition duration-400 group-hover/input:shadow-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:ring-[2px] focus-visible:ring-neutral-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-white dark:shadow-[0px_0px_1px_1px_#404040] dark:focus-visible:ring-neutral-600`,
            className
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  })
);

Input.displayName = 'Input';

// ==================== BoxReveal Component ====================

type BoxRevealProps = {
  children: ReactNode;
  width?: string;
  boxColor?: string;
  duration?: number;
  overflow?: string;
  position?: string;
  className?: string;
};

const BoxReveal = memo(function BoxReveal({
  children,
  width = 'fit-content',
  boxColor,
  duration,
  overflow = 'hidden',
  position = 'relative',
  className,
}: BoxRevealProps) {
  const mainControls = useAnimation();
  const slideControls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      slideControls.start('visible');
      mainControls.start('visible');
    } else {
      slideControls.start('hidden');
      mainControls.start('hidden');
    }
  }, [isInView, mainControls, slideControls]);

  return (
    <section
      ref={ref}
      style={{
        position: position as
          | 'relative'
          | 'absolute'
          | 'fixed'
          | 'sticky'
          | 'static',
        width,
        overflow,
      }}
      className={className}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 75 },
          visible: { opacity: 1, y: 0 },
        }}
        initial='hidden'
        animate={mainControls}
        transition={{ duration: duration ?? 0.5, delay: 0.25 }}
        className={width === '100%' ? 'w-full' : undefined}
      >
        {children}
      </motion.div>
      <motion.div
        variants={{ hidden: { left: 0 }, visible: { left: '100%' } }}
        initial='hidden'
        animate={slideControls}
        transition={{ duration: duration ?? 0.5, ease: 'easeIn' }}
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 0,
          right: 0,
          zIndex: 20,
          background: boxColor ?? '#5046e6',
          borderRadius: 4,
        }}
      />
    </section>
  );
});

// ==================== Ripple Component (Kept for compatibility) ====================

type RippleProps = {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
};

const Ripple = memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 11,
  className = '',
}: RippleProps) {
  return (
    <section
      className={`max-w-full absolute inset-0 flex items-center justify-center
        dark:bg-white/5 bg-neutral-50 pointer-events-none overflow-hidden ${className}`}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const opacity = Math.max(0.04, mainCircleOpacity - i * 0.025);
        return (
          <span
            key={i}
            className='absolute animate-ripple rounded-full border border-indigo-500/20'
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity: opacity,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </section>
  );
});

// ==================== OrbitingCircles (Kept for compatibility) ====================

type OrbitingCirclesProps = {
  className?: string;
  children: ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
};

const OrbitingCircles = memo(function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 10,
  radius = 50,
}: OrbitingCirclesProps) {
  return (
    <section
      style={
        {
          '--duration': duration,
          '--radius': radius,
          '--delay': -delay,
        } as React.CSSProperties
      }
      className={cn(
        'absolute flex size-full pointer-events-none transform-gpu animate-orbit items-center justify-center',
        { '[animation-direction:reverse]': reverse },
        className
      )}
    >
      <div className="pointer-events-auto">{children}</div>
    </section>
  );
});

// ==================== Penguin Classics Books Data ====================

export type PenguinBook = {
  id: string;
  title: string;
  author: string;
  genre: 'Romcom' | 'Philosophy' | 'Comedy' | 'Documentary' | 'Fiction';
  year: string;
  cover: string;
  readUrl: string;
  // Position coordinates in percentage
  left: string;
  top: string;
  // Floating animation parameters
  initRotate: number;
  duration: number;
  delay: number;
  scale: number;
  zIndex: number;
  floatDeltaY: number[];
  floatDeltaX: number[];
};

export const PENGUIN_CLASSICS_BOOKS: PenguinBook[] = [
  // 1. Romcom
  {
    id: 'pride_and_prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    genre: 'Romcom',
    year: '1813',
    cover: '/books/pride_and_prejudice.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/1342',
    left: '3%',
    top: '5%',
    initRotate: -8,
    duration: 22,
    delay: 0,
    scale: 0.98,
    zIndex: 22,
    floatDeltaY: [0, -20, 16, -10, 0],
    floatDeltaX: [0, 14, -10, 12, 0],
  },
  // 2. Philosophy
  {
    id: 'the_republic',
    title: 'The Republic',
    author: 'Plato',
    genre: 'Philosophy',
    year: '375 BC',
    cover: '/books/the_republic.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/1497',
    left: '88%',
    top: '4%',
    initRotate: 9,
    duration: 24,
    delay: 1.5,
    scale: 0.96,
    zIndex: 21,
    floatDeltaY: [0, 18, -22, 12, 0],
    floatDeltaX: [0, -12, 14, -8, 0],
  },
  // 3. Philosophy
  {
    id: 'meditations',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    genre: 'Philosophy',
    year: '180 AD',
    cover: '/books/meditations.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/2680',
    left: '42%',
    top: '3%',
    initRotate: -5,
    duration: 26,
    delay: 3,
    scale: 1.02,
    zIndex: 25,
    floatDeltaY: [0, -22, 20, -14, 0],
    floatDeltaX: [0, 18, -16, 10, 0],
  },
  // 4. Comedy
  {
    id: 'importance_of_being_earnest',
    title: 'The Importance of Being Earnest',
    author: 'Oscar Wilde',
    genre: 'Comedy',
    year: '1895',
    cover: '/books/importance_of_being_earnest.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/844',
    left: '5%',
    top: '28%',
    initRotate: 8,
    duration: 21,
    delay: 2,
    scale: 0.96,
    zIndex: 23,
    floatDeltaY: [0, -16, 22, -12, 0],
    floatDeltaX: [0, 15, -12, 18, 0],
  },
  // 5. Romcom
  {
    id: 'emma',
    title: 'Emma',
    author: 'Jane Austen',
    genre: 'Romcom',
    year: '1815',
    cover: '/books/emma.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/158',
    left: '86%',
    top: '26%',
    initRotate: -7,
    duration: 23,
    delay: 4,
    scale: 0.98,
    zIndex: 22,
    floatDeltaY: [0, 20, -16, 12, 0],
    floatDeltaX: [0, -14, 12, -8, 0],
  },
  // 6. Comedy
  {
    id: 'three_men_in_a_boat',
    title: 'Three Men in a Boat',
    author: 'Jerome K. Jerome',
    genre: 'Comedy',
    year: '1889',
    cover: '/books/three_men_in_a_boat.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/308',
    left: '26%',
    top: '18%',
    initRotate: 6,
    duration: 25,
    delay: 1,
    scale: 1.0,
    zIndex: 26,
    floatDeltaY: [0, 24, -18, 16, 0],
    floatDeltaX: [0, -20, 14, -16, 0],
  },
  // 7. Documentary
  {
    id: 'frederick_douglass',
    title: 'Narrative of Frederick Douglass',
    author: 'Frederick Douglass',
    genre: 'Documentary',
    year: '1845',
    cover: '/books/frederick_douglass.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/23',
    left: '4%',
    top: '52%',
    initRotate: -9,
    duration: 27,
    delay: 3.5,
    scale: 0.96,
    zIndex: 21,
    floatDeltaY: [0, -18, 16, -14, 0],
    floatDeltaX: [0, 14, -16, 12, 0],
  },
  // 8. Fiction
  {
    id: 'frankenstein',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    genre: 'Fiction',
    year: '1818',
    cover: '/books/frankenstein.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/84',
    left: '88%',
    top: '50%',
    initRotate: 7,
    duration: 23,
    delay: 2.5,
    scale: 1.0,
    zIndex: 24,
    floatDeltaY: [0, -22, 18, -16, 0],
    floatDeltaX: [0, 16, -14, 20, 0],
  },
  // 9. Documentary
  {
    id: 'walden',
    title: 'Walden',
    author: 'Henry David Thoreau',
    genre: 'Documentary',
    year: '1854',
    cover: '/books/walden.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/205',
    left: '18%',
    top: '65%',
    initRotate: -6,
    duration: 26,
    delay: 1.8,
    scale: 0.98,
    zIndex: 23,
    floatDeltaY: [0, 20, -24, 14, 0],
    floatDeltaX: [0, -16, 18, -12, 0],
  },
  // 10. Fiction
  {
    id: 'great_gatsby',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    genre: 'Fiction',
    year: '1925',
    cover: '/books/great_gatsby.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/64317',
    left: '84%',
    top: '74%',
    initRotate: 8,
    duration: 20,
    delay: 4.2,
    scale: 0.96,
    zIndex: 22,
    floatDeltaY: [0, 16, -20, 14, 0],
    floatDeltaX: [0, -14, 16, -10, 0],
  },
  // 11. Fiction
  {
    id: 'dracula',
    title: 'Dracula',
    author: 'Bram Stoker',
    genre: 'Fiction',
    year: '1897',
    cover: '/books/dracula.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/345',
    left: '16%',
    top: '38%',
    initRotate: -8,
    duration: 25,
    delay: 0.8,
    scale: 1.0,
    zIndex: 24,
    floatDeltaY: [0, -18, 22, -14, 0],
    floatDeltaX: [0, 16, -18, 12, 0],
  },
  // 12. Fiction
  {
    id: 'crime_and_punishment',
    title: 'Crime and Punishment',
    author: 'Fyodor Dostoevsky',
    genre: 'Fiction',
    year: '1866',
    cover: '/books/crime_and_punishment.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/2554',
    left: '5%',
    top: '76%',
    initRotate: 9,
    duration: 28,
    delay: 2.2,
    scale: 0.96,
    zIndex: 20,
    floatDeltaY: [0, 20, -18, 16, 0],
    floatDeltaX: [0, -14, 15, -12, 0],
  },
  // 13. Romcom
  {
    id: 'jane_eyre',
    title: 'Jane Eyre',
    author: 'Charlotte Brontë',
    genre: 'Romcom',
    year: '1847',
    cover: '/books/jane_eyre.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/1260',
    left: '18%',
    top: '8%',
    initRotate: -6,
    duration: 24,
    delay: 3.2,
    scale: 0.98,
    zIndex: 22,
    floatDeltaY: [0, -20, 18, -12, 0],
    floatDeltaX: [0, 15, -14, 10, 0],
  },
  // 14. Fiction
  {
    id: 'metamorphosis',
    title: 'The Metamorphosis',
    author: 'Franz Kafka',
    genre: 'Fiction',
    year: '1915',
    cover: '/books/metamorphosis.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/5200',
    left: '70%',
    top: '16%',
    initRotate: 7,
    duration: 22,
    delay: 1.2,
    scale: 0.96,
    zIndex: 23,
    floatDeltaY: [0, 18, -20, 14, 0],
    floatDeltaX: [0, -16, 14, -10, 0],
  },
  // 15. Fiction (Floats across center in front of login section)
  {
    id: 'the_odyssey',
    title: 'The Odyssey',
    author: 'Homer',
    genre: 'Fiction',
    year: '800 BC',
    cover: '/books/the_odyssey.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/1727',
    left: '46%',
    top: '40%',
    initRotate: 5,
    duration: 27,
    delay: 2.8,
    scale: 1.04,
    zIndex: 30,
    floatDeltaY: [0, -25, 20, -18, 0],
    floatDeltaX: [0, 22, -18, 16, 0],
  },
  // 16. Philosophy (Upper center in front of login section)
  {
    id: 'the_prince',
    title: 'The Prince',
    author: 'Niccolò Machiavelli',
    genre: 'Philosophy',
    year: '1532',
    cover: '/books/the_prince.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/1232',
    left: '58%',
    top: '8%',
    initRotate: -8,
    duration: 23,
    delay: 4.5,
    scale: 0.98,
    zIndex: 28,
    floatDeltaY: [0, 22, -16, 18, 0],
    floatDeltaX: [0, -18, 20, -14, 0],
  },
  // 17. Philosophy
  {
    id: 'beyond_good_and_evil',
    title: 'Beyond Good and Evil',
    author: 'Friedrich Nietzsche',
    genre: 'Philosophy',
    year: '1886',
    cover: '/books/beyond_good_and_evil.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/4363',
    left: '72%',
    top: '38%',
    initRotate: -5,
    duration: 25,
    delay: 3.8,
    scale: 1.0,
    zIndex: 24,
    floatDeltaY: [0, -19, 21, -13, 0],
    floatDeltaX: [0, 15, -17, 11, 0],
  },
  // 18. Comedy
  {
    id: 'don_quixote',
    title: 'Don Quixote',
    author: 'Miguel de Cervantes',
    genre: 'Comedy',
    year: '1605',
    cover: '/books/don_quixote.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/996',
    left: '71%',
    top: '64%',
    initRotate: 8,
    duration: 26,
    delay: 1.7,
    scale: 0.98,
    zIndex: 23,
    floatDeltaY: [0, 21, -19, 15, 0],
    floatDeltaX: [0, -17, 15, -13, 0],
  },
  // 19. Romcom (Lower center in front of login section)
  {
    id: 'sense_and_sensibility',
    title: 'Sense and Sensibility',
    author: 'Jane Austen',
    genre: 'Romcom',
    year: '1811',
    cover: '/books/sense_and_sensibility.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/161',
    left: '48%',
    top: '76%',
    initRotate: -7,
    duration: 24,
    delay: 2.0,
    scale: 1.02,
    zIndex: 29,
    floatDeltaY: [0, -20, 22, -14, 0],
    floatDeltaX: [0, 18, -16, 14, 0],
  },
  // 20. Documentary (Drifting near lower-left of login section)
  {
    id: 'voyage_of_the_beagle',
    title: 'The Voyage of the Beagle',
    author: 'Charles Darwin',
    genre: 'Documentary',
    year: '1839',
    cover: '/books/voyage_of_the_beagle.jpg',
    readUrl: 'https://www.gutenberg.org/ebooks/944',
    left: '30%',
    top: '72%',
    initRotate: 6,
    duration: 29,
    delay: 4.0,
    scale: 0.96,
    zIndex: 27,
    floatDeltaY: [0, 18, -22, 16, 0],
    floatDeltaX: [0, -15, 18, -12, 0],
  },
];

// ==================== Floating Penguin Books Display ====================
// Only the books are placed in the animation, floating across the entire background with no orbit rings, no text, and no hover effects.

type FloatingBooksDisplayProps = {
  books?: PenguinBook[];
};

const TechOrbitDisplay = memo(function TechOrbitDisplay({
  books = PENGUIN_CLASSICS_BOOKS,
}: FloatingBooksDisplayProps) {
  return (
    <section className='relative h-full w-full overflow-hidden select-none pointer-events-none'>
      {books.map((book) => {
        return (
          <motion.div
            key={book.id}
            style={{
              position: 'absolute',
              left: book.left,
              top: book.top,
              zIndex: book.zIndex,
            }}
            initial={{
              x: 0,
              y: 0,
              rotate: book.initRotate,
              scale: book.scale,
            }}
            animate={{
              y: book.floatDeltaY,
              x: book.floatDeltaX,
              rotate: [
                book.initRotate,
                book.initRotate + 4,
                book.initRotate - 5,
                book.initRotate + 2,
                book.initRotate,
              ],
            }}
            transition={{
              duration: book.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: book.delay,
            }}
          >
            {/* Realistic 3D Penguin Classics Book Cover */}
            <div className='relative h-40 w-28 sm:h-48 sm:w-34 overflow-hidden rounded-[4px] border border-neutral-700/60 bg-neutral-900 shadow-[0_16px_36px_rgba(0,0,0,0.85),0_4px_12px_rgba(0,0,0,0.6)]'>
              {/* Spine highlight overlay for book realistic depth */}
              <div className='pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-white/20 via-black/30 to-transparent z-10' />

              <Image
                src={book.cover}
                alt={book.title}
                fill
                sizes='160px'
                className='object-cover'
                priority
              />

              {/* Penguin Classics subtle banner */}
              <div className='absolute top-0 inset-x-0 bg-black/85 py-0.5 px-1.5 flex items-center justify-between z-10 border-b border-black/80'>
                <span className='text-[8px] font-bold tracking-widest uppercase text-neutral-300'>
                  PENGUIN
                </span>
                <span className='text-[8px] font-semibold text-neutral-400'>
                  {book.genre}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </section>
  );
});

// ==================== AnimatedForm Component ====================

type FieldType = 'text' | 'email' | 'password';

type Field = {
  id?: string;
  label: string;
  required?: boolean;
  type: FieldType;
  placeholder?: string;
  value?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

type AnimatedFormProps = {
  header: string;
  subHeader?: string;
  fields: Field[];
  submitButton: string;
  textVariantButton?: string;
  errorField?: string;
  fieldPerRow?: number;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  googleLogin?: string;
  goTo?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
};

type Errors = {
  [key: string]: string;
};

const AnimatedForm = memo(function AnimatedForm({
  header,
  subHeader,
  fields,
  submitButton,
  textVariantButton,
  errorField,
  onSubmit,
  googleLogin,
  goTo,
  children,
}: AnimatedFormProps) {
  const [visible, setVisible] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});

  const toggleVisibility = () => setVisible(!visible);

  const validateForm = (event: FormEvent<HTMLFormElement>) => {
    const currentErrors: Errors = {};
    const formEl = event.target as HTMLFormElement;

    fields.forEach((field) => {
      const fieldKey = field.id || field.label;
      const value =
        field.value !== undefined
          ? field.value
          : (formEl[fieldKey]?.value ?? (formEl[field.label]?.value || ''));

      if (field.required && !value) {
        currentErrors[field.label] = `${field.label} is required`;
      }

      if (field.type === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
        currentErrors[field.label] = 'Invalid email address';
      }

      if (field.type === 'password' && value && value.length < 6) {
        currentErrors[field.label] =
          'Password must be at least 6 characters long';
      }
    });
    return currentErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formErrors = validateForm(event);

    if (Object.keys(formErrors).length === 0) {
      onSubmit(event);
    } else {
      setErrors(formErrors);
    }
  };

  return (
    <section className='w-full flex flex-col gap-4'>
      <BoxReveal width='100%' boxColor='var(--skeleton)' duration={0.3}>
        <h2 className='font-bold text-3xl text-neutral-800 dark:text-neutral-100'>
          {header}
        </h2>
      </BoxReveal>

      {subHeader && (
        <BoxReveal width='100%' boxColor='var(--skeleton)' duration={0.3} className='pb-2'>
          <p className='text-neutral-600 text-sm max-w-sm dark:text-neutral-400'>
            {subHeader}
          </p>
        </BoxReveal>
      )}

      {googleLogin && (
        <>
          <BoxReveal
            boxColor='var(--skeleton)'
            duration={0.3}
            overflow='visible'
            width='100%'
          >
            <button
              className='g-button group/btn bg-neutral-900 hover:bg-neutral-800 text-white w-full rounded-md border border-neutral-800 h-10 font-medium outline-hidden hover:cursor-pointer transition-colors relative'
              type='button'
              onClick={() => alert('Google authentication simulated!')}
            >
              <span className='flex items-center justify-center w-full h-full gap-3 text-sm'>
                <Image
                  src='https://cdn.21st.dev/assets/mirror/89/8948eafec4a9c68b2b3a78a756b4474c05e53431f208149556fb669e3c429be2.png'
                  width={20}
                  height={20}
                  alt='Google Icon'
                />
                {googleLogin}
              </span>
              <BottomGradient />
            </button>
          </BoxReveal>

          <BoxReveal boxColor='var(--skeleton)' duration={0.3} width='100%'>
            <section className='flex items-center gap-4 w-full'>
              <hr className='flex-1 border-t border-dashed border-neutral-300 dark:border-neutral-800' />
              <p className='text-neutral-500 text-xs uppercase tracking-wider dark:text-neutral-400'>
                or continue with
              </p>
              <hr className='flex-1 border-t border-dashed border-neutral-300 dark:border-neutral-800' />
            </section>
          </BoxReveal>
        </>
      )}

      <form onSubmit={handleSubmit} className='w-full'>
        <section className='flex flex-col gap-3 mb-4 w-full'>
          {fields.map((field) => (
            <section key={field.label} className='flex flex-col gap-1.5 w-full'>
              <BoxReveal width='100%' boxColor='var(--skeleton)' duration={0.3}>
                <Label htmlFor={field.label}>
                  {field.label}{' '}
                  {field.required && <span className='text-red-500'>*</span>}
                </Label>
              </BoxReveal>

              <BoxReveal
                width='100%'
                boxColor='var(--skeleton)'
                duration={0.3}
                className='flex flex-col space-y-1 w-full'
              >
                <section className='relative w-full'>
                  <Input
                    type={
                      field.type === 'password'
                        ? visible
                          ? 'text'
                          : 'password'
                        : field.type
                    }
                    id={field.id || field.label}
                    name={field.id || field.label}
                    placeholder={field.placeholder}
                    value={field.value !== undefined ? field.value : undefined}
                    onChange={field.onChange}
                  />

                  {field.type === 'password' && (
                    <button
                      type='button'
                      onClick={toggleVisibility}
                      className='absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-neutral-400 hover:text-neutral-200'
                    >
                      {visible ? (
                        <Eye className='h-4 w-4' />
                      ) : (
                        <EyeOff className='h-4 w-4' />
                      )}
                    </button>
                  )}
                </section>

                {errors[field.label] && (
                  <p className='text-red-400 text-xs mt-1'>
                    {errors[field.label]}
                  </p>
                )}
              </BoxReveal>
            </section>
          ))}
        </section>

        {children && (
          <div className='mb-4 w-full'>
            {children}
          </div>
        )}

        <BoxReveal width='100%' boxColor='var(--skeleton)' duration={0.3}>
          {errorField && (
            <div className='mb-4 rounded-lg bg-red-950/70 border border-red-500/40 px-3 py-2 text-xs text-red-200'>
              {errorField}
            </div>
          )}
        </BoxReveal>

        <BoxReveal
          width='100%'
          boxColor='var(--skeleton)'
          duration={0.3}
          overflow='visible'
        >
          <button
            className='bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white relative group/btn block w-full rounded-md h-10 font-medium shadow-md outline-hidden hover:cursor-pointer hover:brightness-110 transition-all'
            type='submit'
          >
            {submitButton} &rarr;
            <BottomGradient />
          </button>
        </BoxReveal>

        {textVariantButton && goTo && (
          <BoxReveal width='100%' boxColor='var(--skeleton)' duration={0.3}>
            <section className='mt-4 text-center w-full'>
              <button
                type='button'
                className='text-sm text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer outline-hidden'
                onClick={goTo}
              >
                {textVariantButton}
              </button>
            </section>
          </BoxReveal>
        )}
      </form>
    </section>
  );
});

const BottomGradient = () => {
  return (
    <>
      <span className='group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent' />
      <span className='group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent' />
    </>
  );
};

// ==================== AuthTabs Component ====================

interface AuthTabsProps {
  formFields: {
    header: string;
    subHeader?: string;
    fields: Field[];
    submitButton: string;
    textVariantButton?: string;
    errorField?: string;
  };
  goTo: (event: React.MouseEvent<HTMLButtonElement>) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  children?: React.ReactNode;
}

const AuthTabs = memo(function AuthTabs({
  formFields,
  goTo,
  handleSubmit,
  children,
}: AuthTabsProps) {
  return (
    <div className='relative flex min-h-screen w-full items-center justify-center bg-neutral-950 text-white overflow-hidden'>
      {/* Background Layer 1: Authentic Historic Library Bookshelves (Entire Section) */}
      <div className='absolute inset-0 z-0 pointer-events-none select-none'>
        <Image
          src='/books-bg.jpg'
          alt='Historic Library Bookshelves Background'
          fill
          priority
          sizes='100vw'
          className='object-cover object-center opacity-65 filter brightness-85 contrast-110'
        />
        {/* Cinematic atmospheric vignette overlays */}
        <div className='absolute inset-0 bg-neutral-950/35' />
        <div className='absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-transparent to-neutral-950/50' />
        <div className='absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-neutral-950/20 to-neutral-950/60' />
      </div>

      {/* Background Layer 2: Floating Books Layer (Behind the login card) */}
      <div className='absolute inset-0 z-10 pointer-events-none select-none overflow-hidden'>
        <TechOrbitDisplay />
      </div>

      {/* Foreground Layer 3: Centered Login Section IN FRONT of all floating books */}
      <div className='relative z-30 w-full max-w-md px-4 sm:px-6 py-10 pointer-events-auto'>
        <div className='w-full rounded-2xl border border-white/15 bg-neutral-950/90 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_50px_rgba(0,0,0,0.8)]'>
          <AnimatedForm
            {...formFields}
            fieldPerRow={1}
            onSubmit={handleSubmit}
            goTo={goTo}
            googleLogin='Login with Google'
          >
            {children}
          </AnimatedForm>
        </div>
      </div>
    </div>
  );
});

// ==================== Label Component ====================

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
}

const Label = memo(function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none text-neutral-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  );
});

// ==================== Exports ====================

export {
  Input,
  BoxReveal,
  Ripple,
  OrbitingCircles,
  TechOrbitDisplay,
  AnimatedForm,
  AuthTabs,
  Label,
  BottomGradient,
};
