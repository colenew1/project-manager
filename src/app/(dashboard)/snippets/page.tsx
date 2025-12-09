'use client';

import { useState } from 'react';
import { Plus, Code2, Search, Copy, Check, Star, StarOff } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Placeholder - will be replaced with real data from Supabase
const mockSnippets = [
  {
    id: '1',
    title: 'React useState Hook',
    language: 'typescript',
    code: `const [state, setState] = useState<string>('');`,
    description: 'Basic useState hook with TypeScript',
    is_favorite: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Supabase Query',
    language: 'typescript',
    code: `const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('column', value);`,
    description: 'Basic Supabase select query',
    is_favorite: false,
    created_at: new Date().toISOString(),
  },
];

const languages = [
  'typescript',
  'javascript',
  'python',
  'rust',
  'go',
  'bash',
  'sql',
  'css',
  'html',
];

export default function SnippetsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter snippets
  const filteredSnippets = mockSnippets.filter((snippet) => {
    if (languageFilter !== 'all' && snippet.language !== languageFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        snippet.title.toLowerCase().includes(query) ||
        snippet.code.toLowerCase().includes(query) ||
        snippet.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const copyCode = async (id: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <Header title="Snippets" />

      <div className="p-4 md:p-6">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search snippets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Snippet
          </Button>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 bg-muted/50">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              <Code2 className="inline-block mr-2 h-4 w-4" />
              Snippet management is coming soon! This page will let you save and organize code snippets for quick reference.
            </p>
          </CardContent>
        </Card>

        {/* Snippets Grid */}
        {filteredSnippets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Code2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No snippets found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? 'Try a different search term.'
                : 'Add your first code snippet to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredSnippets.map((snippet) => (
              <Card key={snippet.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{snippet.title}</CardTitle>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {snippet.language}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        {snippet.is_favorite ? (
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyCode(snippet.id, snippet.code)}
                      >
                        {copiedId === snippet.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {snippet.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {snippet.description}
                    </p>
                  )}
                  <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                    <code>{snippet.code}</code>
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
