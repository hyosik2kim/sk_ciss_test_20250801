import React, { useState } from 'react';
import { SCARErrorCodeEntry, SCARErrorType } from '@/types/monitoring_status';

type Props = {
  errorCodes: SCARErrorCodeEntry[];
  setErrorCodes: React.Dispatch<React.SetStateAction<SCARErrorCodeEntry[]>>;
};

function SCARErrorCodeSidebar({ errorCodes, setErrorCodes }: Props) {
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<SCARErrorType>("User");

  const handleDelete = (idx: number) =>
    setErrorCodes(codes => codes.filter((_, i) => i !== idx));

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    setErrorCodes(prev => [
      ...prev,
      { code: newCode.trim(), label: newLabel.trim(), type: newType }
    ]);
    setNewCode("");
    setNewLabel("");
    setNewType("User");
  };

  return (
    <div className="fixed right-0 top-0 h-full w-120 bg-white shadow-xl p-4 flex flex-col z-10">
      <div className="text-lg font-bold mb-2">에러 코드 목록</div>
      <ul className="flex-1 overflow-y-auto">
        {errorCodes.map((e, idx) => (
          <li key={e.code} className="flex items-center justify-between mb-2">
            <div>
              <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{e.code}</span>
              <span className="ml-2">{e.label}</span>
              <span className="ml-2 text-xs text-gray-400">{e.type}</span>
            </div>
            <button onClick={() => handleDelete(idx)} className="text-red-400 px-2">삭제</button>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input className="border px-2 py-1 w-16" value={newCode}
            onChange={e => setNewCode(e.target.value)} placeholder="코드" required />
          <input className="border px-2 py-1 w-24" value={newLabel}
            onChange={e => setNewLabel(e.target.value)} placeholder="설명" />
          <select className="border px-2 py-1 w-20" value={newType}
            onChange={e => setNewType(e.target.value as SCARErrorType)}>
            <option value="User">User</option>
            <option value="Server">Server</option>
            <option value="EV">EV</option>
            <option value="EVSE">EVSE</option>
          </select>
          <button type="submit" className="bg-blue-500 text-white px-2 py-1 rounded">추가</button>
        </form>
      </div>
    </div>
  );
}

export default SCARErrorCodeSidebar;
