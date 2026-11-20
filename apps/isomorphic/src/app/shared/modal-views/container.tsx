'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Modal } from '@core/modal-views/modal';
import { useModal } from '@/app/shared/modal-views/use-modal';

export default function GlobalModal() {
  const { isOpen, view, closeModal, customSize, size } = useModal();
  const pathname = usePathname();
  useEffect(() => {
    closeModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      customSize={customSize}
      size={size}
      // Effet verre : arrière-plan assombri et légèrement flouté, la fenêtre ressort au centre.
      overlayClassName="!bg-gray-900/40 backdrop-blur-[6px] dark:!bg-black/50"
      containerClassName="shadow-2xl ring-1 ring-black/5 dark:bg-gray-100"
      className="z-[9999] [&_.pointer-events-none]:overflow-visible"
    >
      {view}
    </Modal>
  );
}
