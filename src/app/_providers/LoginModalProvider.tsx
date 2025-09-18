"use client";

import React, { useEffect, useState, useCallback } from "react";
import LoginModal from "@/app/_components/LoginModal";

// Tipado de eventos personalizados para TypeScript (sin any)
declare global {
  interface WindowEventMap {
    "open-login-modal": CustomEvent<void>;
    "close-login-modal": CustomEvent<void>;
  }
}

export default function LoginModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  useEffect(() => {
    // Escuchar el evento que dispara ProductCard / VariantPicker
    const onOpen = () => openModal();
    const onClose = () => closeModal();

    window.addEventListener("open-login-modal", onOpen as EventListener);
    window.addEventListener("close-login-modal", onClose as EventListener);

    return () => {
      window.removeEventListener("open-login-modal", onOpen as EventListener);
      window.removeEventListener("close-login-modal", onClose as EventListener);
    };
  }, [openModal, closeModal]);

  return (
    <>
      {children}
      <LoginModal open={open} onClose={closeModal} />
    </>
  );
}
