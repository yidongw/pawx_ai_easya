'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import React, { useState } from 'react';

type Token = 'SOL' | 'USDC';

type NewCampaignDialogProps = {
  onSubmit: (campaign: {
    name: string;
    keywords: string[];
    code: string;
    rewardAmount: number | null;
    rewardTicker: Token | null;
  }) => Promise<void>;
};

export default function NewCampaignDialog({ onSubmit }: NewCampaignDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [code, setCode] = useState('');
  const [rewardAmount, setRewardAmount] = useState<string>('');
  const [rewardTicker, setRewardTicker] = useState<Token | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleKeywordInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === ' ' || e.key === 'Enter') && keywordInput.trim()) {
      e.preventDefault();
      const newKeyword = keywordInput.trim().replace(/\s/g, '');
      if (!keywords.includes(newKeyword)) {
        setKeywords([...keywords, newKeyword]);
      }
      setKeywordInput('');
    }
  };

  const handleKeywordBlur = () => {
    if (keywordInput.trim()) {
      const newKeyword = keywordInput.trim().replace(/\s/g, '');
      if (!keywords.includes(newKeyword)) {
        setKeywords([...keywords, newKeyword]);
      }
      setKeywordInput('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(keyword => keyword !== keywordToRemove));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (Number(value) >= 0 && !Number.isNaN(Number(value)))) {
      setRewardAmount(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const campaignData = {
      name: name.trim(),
      keywords,
      code: code.trim(),
      rewardAmount: rewardAmount ? Number(rewardAmount) : null,
      rewardTicker,
    };

    setIsSubmitting(true);

    try {
      await onSubmit(campaignData);

      // Reset form only on success
      setName('');
      setKeywords([]);
      setKeywordInput('');
      setCode('');
      setRewardAmount('');
      setRewardTicker(null);
      setOpen(false);
    } catch {
      // Keep dialog open on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = name.trim() && code.trim() && keywords.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Campaign</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-3">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter campaign name"
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="keywords">Keywords</Label>
            <Input
              id="keywords"
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              onKeyDown={handleKeywordInput}
              onBlur={handleKeywordBlur}
              placeholder="Type keywords and press space or enter to add"
            />
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {keywords.map(keyword => (
                  <Badge key={keyword} variant="secondary" className="text-xs">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Label>Reward (Optional)</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  value={rewardAmount}
                  onChange={handleAmountChange}
                  placeholder="Amount"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="w-24">
                <Select value={rewardTicker || ''} onValueChange={(value: Token) => setRewardTicker(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Token" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOL">SOL</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="code">
              Code (ask
              {' '}
              <a
                href="https://t.me/alan_ywang"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Alan
              </a>
              {' '}
              to get it)
            </Label>
            <Input
              id="code"
              value={code}
              onChange={e => setCode(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
