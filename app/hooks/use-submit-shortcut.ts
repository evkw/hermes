import { useEffect, type RefObject } from "react";

/**
 * Submits a form on Shift+Enter from any field within the form.
 * Attach the returned formRef to your <form>.
 */
export function useSubmitShortcut(formRef: RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        form!.requestSubmit();
      }
    }

    form.addEventListener("keydown", handleKeyDown);
    return () => form.removeEventListener("keydown", handleKeyDown);
  }, [formRef]);
}
