'use client'

interface ComposeModalProps {
  onClose: () => void
}

export default function ComposeModal({ onClose }: ComposeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <p className="text-gray-500 text-sm">Compose modal — coming soon</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 text-sm rounded-full border border-gray-200 hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  )
}
