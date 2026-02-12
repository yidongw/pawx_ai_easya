import type { NoteTweetEntities, TwitterStatus, TwitterStatusMedia, TwitterUser } from '@/types/twitter';
import { CountdownTimer } from '@/components/common/CountdownTimer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useTokenStore } from '@/store/tokenStore';
import DOMPurify from 'dompurify';
import { BarChart2, Bookmark, Coins, ExternalLink, Heart, MessageCircle, Quote, Repeat2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { UserInfoHeader } from '../common/UserInfoHeader';

function formatCount(n?: number) {
  if (!n) {
    return '';
  }
  if (n >= 1000000) {
    return `${(n / 1000000).toFixed(1)}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}K`;
  }
  return n.toString();
}

function renderText(text: string, entities?: NoteTweetEntities, medias?: TwitterStatusMedia[] | null, isReply: boolean = false) {
  if (!text) {
    return '';
  }

  let result = text;

  // First, replace media URLs directly from the medias array
  if (medias) {
    medias.forEach((media) => {
      if (media.url) {
        result = result.replace(media.url, '');
      }
    });
  }

  if (!entities) {
    return result;
  }

  const elements: Array<{ start: number; end: number; type: string; data: any }> = [];

  // Collect all entities
  if (entities.hashtags) {
    entities.hashtags.forEach((hashtag: any) => {
      elements.push({
        start: hashtag.indices[0],
        end: hashtag.indices[1],
        type: 'hashtag',
        data: hashtag,
      });
    });
  }

  if (entities.symbols) {
    entities.symbols.forEach((symbol: any) => {
      elements.push({
        start: symbol.indices[0],
        end: symbol.indices[1],
        type: 'symbol',
        data: symbol,
      });
    });
  }

  if (entities.urls) {
    entities.urls.forEach((url: any) => {
      // Check if this URL is a media URL
      const isMediaUrl = medias?.some(media => media.url === url.url);

      elements.push({
        start: url.indices[0],
        end: url.indices[1],
        type: isMediaUrl ? 'media_url' : 'url',
        data: url,
      });
    });
  }

  if (entities.user_mentions) {
    entities.user_mentions.forEach((mention: any, index: number) => {
      elements.push({
        start: mention.indices[0],
        end: mention.indices[1],
        type: isReply && index === 0 ? 'first_reply_mention' : 'user_mention',
        data: mention,
      });
    });
  }

  // Sort by start position (reverse order to avoid index shifting)
  elements.sort((a, b) => b.start - a.start);

  // Replace text with styled elements
  elements.forEach((element) => {
    const before = result.substring(0, element.start);
    const after = result.substring(element.end);

    let replacement = '';
    switch (element.type) {
      case 'hashtag':
        replacement = `<span class="text-blue-500 dark:text-blue-400">${result.substring(element.start, element.end)}</span>`;
        break;
      case 'symbol':
        replacement = `<span class="text-purple-500 dark:text-purple-400">${result.substring(element.start, element.end)}</span>`;
        break;
      case 'url':
        replacement = `<a href="${element.data.expanded_url || element.data.url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 dark:text-blue-400 hover:underline">${element.data.display_url || result.substring(element.start, element.end)}</a>`;
        break;
      case 'media_url':
        replacement = ''; // Replace media URLs with empty string
        break;
      case 'first_reply_mention':
        replacement = ''; // Replace first user mention in replies with empty string
        break;
      case 'user_mention':
        replacement = `<a href="/profiles/${element.data.screen_name}" target="_blank" rel="noopener noreferrer" class="text-blue-500 dark:text-blue-400 hover:underline">${result.substring(element.start, element.end)}</a>`;
        break;
    }

    result = before + replacement + after;
  });

  // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
  return <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(result.trim()) }} />;
}

export const Tweet: React.FC<{ tweet: TwitterStatus; twitterUser: TwitterUser }> = ({ tweet, twitterUser }) => {
  const user: TwitterUser | undefined = tweet.user || twitterUser;
  const isRepost = !!tweet.retweetedStatusIdStr && tweet.retweetedUserScreenName;
  const isReply = !!tweet.inReplyToUserScreenName;
  const isQuote = !!tweet.quotedStatus;
  const [showFullText, setShowFullText] = useState(false);
  const hasFullText = tweet.fullText && tweet.fullText !== tweet.text;
  const statusCreatedAt = tweet.retweetedStatusCreatedAt || tweet.createdAt;
  const { setSelectedTokenByKey } = useTokenStore();

  // const { tokens: tokenStore, setSelectedTokenByKey } = useTokenStore();

  // // Extract tokens from tweet text
  // const detectedTokens = useMemo((): Token[] => {
  //   const text = tweet.fullText || tweet.text || '';
  //   const foundTokens: Token[] = [];

  //   // Check each token in the store to see if its symbol is in the text
  //   Object.values(tokenStore).forEach((token: any) => {
  //     // Create case-insensitive pattern that matches the symbol with optional dollar sign prefix
  //     const symbolPattern = new RegExp(`(\\$|\\b)${token.symbol}\\b`, 'i');
  //     if (symbolPattern.test(text)) {
  //       // Check if not already added
  //       if (!foundTokens.some(t => t.ca === token.token_address && t.chainIds?.[0] === token.chainId)) {
  //         foundTokens.push({
  //           ca: token.token_address,
  //           symbol: token.symbol,
  //           name: token.name,
  //           chainIds: [token.chainId],
  //         });
  //       }
  //     }
  //   });

  //   return foundTokens;
  // }, [tweet.fullText, tweet.text, tokenStore]);

  // // Merge detected tokens with tokens from the tweet object
  // const allTokens = useMemo(() => {
  //   const tokensArray = [...detectedTokens];

  //   // Add tokens from tweet.tokens if they exist and aren't already in detectedTokens
  //   if (tweet.tokens) {
  //     tweet.tokens.forEach((token) => {
  //       if (!tokensArray.some(t => t.ca === token.ca && t.chainIds?.[0] === token.chainIds?.[0])) {
  //         tokensArray.push(token);
  //       }
  //     });
  //   }

  //   return tokensArray;
  // }, [detectedTokens, tweet.tokens]);

  // Get tokens directly from the status
  const allTokens = useMemo(() => {
    return tweet.tokens || [];
  }, [tweet.tokens]);

  const handleTokenClick = (ca: string, _symbol?: string, _name?: string, chainIds?: number[]) => {
    // Default to BSC (56) if chainIds is not provided or empty
    const chainId: number = chainIds?.[0] ?? 56;
    const key = `${chainId}-${ca}`;
    setSelectedTokenByKey(key);
  };

  return (
    <div className="p-2 w-full max-w-xl relative">
      {/* Show replied-to tweet context if present */}
      {tweet.replyToStatus && !isRepost && (
        <div className="mb-2 border-l-2 border-gray-400 dark:border-gray-500 rounded-r">
          <Tweet tweet={tweet.replyToStatus} twitterUser={twitterUser} />
        </div>
      )}
      <div className="relative">
        {/* Repost banner */}
        {isRepost && (
          <div className="flex items-center text-xs text-gray-500 mb-1">
            <Repeat2 className="w-4 h-4 mr-1" />
            {twitterUser.name || twitterUser.screenName || 'Someone'}
            {' '}
            reposted
            ·
            {tweet.createdAt && <CountdownTimer date={tweet.createdAt} className="text-gray-400" />}
          </div>
        )}

        {/* First row: Avatar, user info, and time */}
        <UserInfoHeader
          name={user?.name}
          screenName={user?.screenName}
          profileImageUrl={user?.profileImageUrlHttps}
          verified={user?.verified}
          time={statusCreatedAt}
        />

        {/* External link to original tweet */}
        <a
          href={`https://x.com/${user?.screenName}/status/${tweet.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute -top-1 -right-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="View on X"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Token Symbols Row */}
      {allTokens.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 mt-1">
          {allTokens.map(token => (
            <Badge
              key={`${token.ca}-${token.chainIds?.[0]}`}
              className="cursor-pointer bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 transition-all duration-200 flex items-center gap-1 px-3 py-1 shadow-md hover:shadow-lg"
              onClick={() => handleTokenClick(token.ca, token.symbol, token.name, token.chainIds)}
            >
              <Coins className="w-3 h-3" />
              <span className="font-semibold">{token.symbol || 'Token'}</span>
              {token.name && (
                <span className="text-xs opacity-90">
                  (
                  {token.name}
                  )
                </span>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Second row: Tweet text */}
      <div className="mb-2">
        {/* Replying to */}
        {isReply && (
          <div className="text-xs text-blue-500 dark:text-blue-400 mb-1">
            Replying to
            {' '}
            <span className="hover:underline">
              @
              {tweet.inReplyToUserScreenName}
            </span>
          </div>
        )}
        {/* Tweet text */}
        <div className="text-base whitespace-pre-wrap break-words">
          {renderText(showFullText ? (tweet.fullText || tweet.text) : tweet.text, showFullText ? tweet.notetweetEntities : tweet.entities, tweet.medias, isReply)}
        </div>
        {/* Show more button */}
        {hasFullText && !showFullText && (
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-500 dark:text-blue-400 hover:text-blue-600 p-0 h-auto mt-1"
            onClick={() => setShowFullText(true)}
          >
            Show more
          </Button>
        )}
      </div>

      {/* Third row: Media */}
      {tweet.medias && tweet.medias.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {tweet.medias.map(media => (
            <Dialog key={media.media_url_https}>
              <DialogTrigger asChild>
                <img
                  src={media.media_url_https}
                  alt="media"
                  className="rounded max-h-80 object-cover cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                  style={{ maxWidth: '200px' }}
                />
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 w-fit h-fit">
                <img
                  src={media.media_url_https}
                  alt="media"
                  className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg"
                />
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}

      {/* Fourth row: Quoted tweet */}
      {isQuote && tweet.quotedStatus && (
        <div className="mb-2 border rounded-lg p-2">
          <Tweet tweet={tweet.quotedStatus} twitterUser={twitterUser} />
        </div>
      )}

      {/* Fifth row: Stats */}
      <div className="flex items-center flex-wrap text-gray-500 text-xs mt-2 mb-1">
        <span className="flex items-center">
          <MessageCircle className="w-4 h-4" />
          {formatCount(tweet.replyCount)}
          &nbsp;
        </span>
        <span className="flex items-center gap-0.5">
          <Repeat2 className="w-4 h-4" />
          {formatCount(tweet.retweetCount)}
          &nbsp;
        </span>
        <span className="flex items-center gap-0.5">
          <Heart className="w-4 h-4" />
          {formatCount(tweet.favoriteCount)}
          &nbsp;
        </span>
        <span className="flex items-center gap-0.5">
          <Bookmark className="w-4 h-4" />
          {formatCount(tweet.bookmarkCount)}
          &nbsp;
        </span>
        <span className="flex items-center gap-0.5">
          <Quote className="w-4 h-4" />
          {formatCount(tweet.quoteCount)}
          &nbsp;
        </span>
        <span className="flex items-center gap-0.5">
          <BarChart2 className="w-4 h-4" />
          {formatCount(tweet.viewCount)}
         &nbsp;
        </span>
      </div>
    </div>
  );
};
