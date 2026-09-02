"use client";

import { useState, useEffect } from "react";
import { Siren, PhoneCall, X } from "lucide-react";

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Emergency SOS modal — call ambulance, manage saved emergency contacts.
 */
export default function SOSModal({ isOpen, onClose }: SOSModalProps) {
  const [contacts, setContacts] = useState<string[]>([]);
  const [newContact, setNewContact] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("emergency_contacts");
    if (saved) setContacts(JSON.parse(saved));
  }, []);

  const saveContact = () => {
    if (contacts.length < 5 && newContact) {
      const updated = [...contacts, newContact];
      setContacts(updated);
      localStorage.setItem("emergency_contacts", JSON.stringify(updated));
      setNewContact("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[4000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-black text-red-600 mb-6 flex items-center gap-2">
          <Siren /> Emergency Hub
        </h2>

        <button
          onClick={() => (window.location.href = "tel:102")}
          className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold mb-3 flex items-center justify-center gap-2"
        >
          <PhoneCall /> CALL AMBULANCE
        </button>

        <div className="mt-4">
          <h3 className="text-[10px] font-black text-slate-400 mb-2 uppercase">
            Saved Contacts ({contacts.length}/5)
          </h3>
          {contacts.map((c, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <button
                className="flex-1 bg-slate-50 p-3 rounded-xl font-bold text-left"
                onClick={() => (window.location.href = `tel:${c}`)}
              >
                {c}
              </button>
            </div>
          ))}
          {contacts.length < 5 && (
            <div className="flex gap-2 mt-2">
              <input
                type="tel"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                placeholder="Add Number"
                className="flex-1 bg-slate-100 p-3 rounded-xl outline-none text-black font-bold"
              />
              <button
                onClick={saveContact}
                className="bg-black text-white px-4 rounded-xl font-bold"
              >
                ADD
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
