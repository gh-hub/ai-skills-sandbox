"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";

type HeroVisibilityContextValue = {
  heroVisible: boolean;
  setHeroVisible: Dispatch<SetStateAction<boolean>>;
};

// Default (no provider in the tree) resolves to "hero not visible", i.e. show
// login — this is what makes every route except home show HeaderAuthControl
// immediately with zero extra wiring.
const noopSetHeroVisible: Dispatch<SetStateAction<boolean>> = () => {};

const HeroVisibilityContext = createContext<HeroVisibilityContextValue>({
  heroVisible: false,
  setHeroVisible: noopSetHeroVisible,
});

export function HeroVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [heroVisible, setHeroVisible] = useState(false);

  return (
    <HeroVisibilityContext.Provider value={{ heroVisible, setHeroVisible }}>
      {children}
    </HeroVisibilityContext.Provider>
  );
}

export function useHeroVisibility(): HeroVisibilityContextValue {
  return useContext(HeroVisibilityContext);
}

// Mirrors the IntersectionObserver's `rootMargin: "-40px 0px 0px 0px"` logic
// below: the observer shrinks the *effective* viewport top by 40px, so an
// element "intersects" once its bottom edge is more than 40px below the real
// viewport top (and its top edge hasn't scrolled past the viewport bottom).
// Used for a synchronous same-paint check — see useReportHeroVisibility.
function isHeroOnScreen(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.bottom > 40 && rect.top < window.innerHeight;
}

// Reports whether the hero card (referenced by `ref`) has scrolled past the
// viewport top into HeroVisibilityContext, via IntersectionObserver. The
// rootMargin shrinks the effective viewport top by 40px so the trigger fires
// once the hero is effectively scrolled past, without requiring its bottom
// edge to literally clear y=0 (real layouts can fall a few dozen px short of
// full clearance depending on rendering/viewport specifics).
export function useReportHeroVisibility(ref: RefObject<HTMLElement | null>): void {
  const { setHeroVisible } = useHeroVisibility();

  // useLayoutEffect (not useEffect) so the synchronous initial check below
  // runs after the DOM is committed but before the browser paints — this is
  // what prevents the home route's login control from ever flashing visible
  // on load: the hero is on screen at mount time, but the default context
  // value (see HeroVisibilityProvider above) is `false`, correct for every
  // other route but wrong for home for the instant before the (async)
  // IntersectionObserver fires its first callback.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    // Synchronous same-paint correction: compute the real initial state
    // immediately, instead of waiting on the observer's async first
    // callback.
    setHeroVisible(isHeroOnScreen(element));

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroVisible(entry.isIntersecting);
      },
      { rootMargin: "-40px 0px 0px 0px" },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, setHeroVisible]);
}
