import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { fetchSuggestions } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface SearchFieldProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchField({ onSearch, placeholder = 'Search...', autoFocus }: SearchFieldProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ text: string; title: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestionsDebounced = setTimeout(async () => {
      if (query.trim()) {
        const results = await fetchSuggestions(query);
        setSuggestions(results.map(r => ({ 
          text: r.attributes.text,
          title: r.attributes.title
        })));
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(fetchSuggestionsDebounced);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const suggestion = suggestions[selectedIndex];
      navigate(`/search?q=${encodeURIComponent(suggestion.text)}`);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full px-4 py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                index === selectedIndex ? 'bg-gray-50' : ''
              }`}
              onClick={() => {
                navigate(`/search?q=${encodeURIComponent(suggestion.text)}`);
                setShowSuggestions(false);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="text-sm text-gray-900">{suggestion.text}</div>
              {suggestion.text !== suggestion.title && (
                <div className="text-xs text-gray-500 truncate">
                  {suggestion.title}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}