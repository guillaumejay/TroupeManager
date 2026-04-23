import { useState, useEffect, useRef } from 'react';
import { useCampaign } from '../../context/CampaignContext';
import type { Marine, Specialisation } from '../../types';

const SPECIALISATIONS: Specialisation[] = [
  'Fusilier', 'Comtech', 'Medic', 'SmartGun', 'Recon', 'Sniper', 'NRBC', 'Heavy',
];

const GRADES = ['2nd', 'Caporal', 'Caporale', 'Sergent', 'Lieutenant'];

interface EditSheetModalProps {
  marine: Marine;
  onClose: () => void;
}

export function EditSheetModal({ marine, onClose }: EditSheetModalProps) {
  const { dispatch } = useCampaign();
  const [nom, setNom] = useState(marine.nom);
  const [grade, setGrade] = useState(marine.grade);
  const [specialisation, setSpecialisation] = useState<Specialisation>(marine.specialisation);
  const nomRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nomRef.current?.focus();
    nomRef.current?.select();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNom = nom.trim();
    if (!trimmedNom) return;

    if (trimmedNom !== marine.nom) {
      dispatch({ type: 'UPDATE_MARINE', marineId: marine.id, field: 'nom', value: trimmedNom });
    }
    if (grade !== marine.grade) {
      dispatch({ type: 'UPDATE_MARINE', marineId: marine.id, field: 'grade', value: grade });
    }
    if (specialisation !== marine.specialisation) {
      dispatch({ type: 'UPDATE_MARINE', marineId: marine.id, field: 'specialisation', value: specialisation });
    }

    onClose();
  };

  const isCustomGrade = !GRADES.includes(marine.grade);
  const gradeOptions = isCustomGrade ? [marine.grade, ...GRADES] : GRADES;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 border border-gray-700 rounded-lg p-5 space-y-4 w-full max-w-md shadow-xl"
      >
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
          Fiche — {marine.nom}
        </h3>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Nom / Indicatif</label>
          <input
            ref={nomRef}
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full bg-gray-700 text-gray-100 text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Grade</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full bg-gray-700 text-gray-100 text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
            >
              {gradeOptions.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Spécialisation</label>
            <select
              value={specialisation}
              onChange={(e) => setSpecialisation(e.target.value as Specialisation)}
              className="w-full bg-gray-700 text-gray-100 text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
            >
              {SPECIALISATIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium transition-colors cursor-pointer"
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors cursor-pointer"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
