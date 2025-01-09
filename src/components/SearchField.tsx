import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchFieldProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function SearchField({ initialQuery = '', onSearch, isLoading }: SearchFieldProps) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
    navigate(`/?q=${encodeURIComponent(query)}`); // Navigate with query parameter
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for maps and data..."
          className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="absolute inset-y-0 right-0 px-3 flex items-center bg-transparent"
          disabled={isLoading}
        >
          <Search 
            className={`h-5 w-5 ${isLoading ? 'text-gray-400' : 'text-gray-500 hover:text-gray-700'}`} 
          />
        </button>
      </div>
    </form>
  );
}