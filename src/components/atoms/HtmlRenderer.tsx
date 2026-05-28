import React from 'react';
import { Text, View, TextStyle, ViewStyle, useColorScheme, Linking, Alert } from 'react-native';

interface HtmlRendererProps {
  html: string;
  style?: TextStyle;
  containerStyle?: ViewStyle;
}

/**
 * A simple component to render basic HTML tags in React Native.
 * Supports <b>, <i>, <u>, <br>, <p>, and <strong>.
 */
export const HtmlRenderer: React.FC<HtmlRendererProps> = ({ html, style, containerStyle }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  if (!html) return null;

  // Use default colors if not provided in style
  const defaultStyle: TextStyle = {
    color: isDarkMode ? '#FFFFFF' : '#111827',
  };

  // Replace <br> and <p> tags with newlines, and handle HTML entities
  const processedHtml = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p\s*>/gi, '\n\n')
    .replace(/<p\s*[^>]*>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // Function to parse the remaining tags (<b>, <i>, <u>, <strong>, <a>)
  const parseTags = (text: string) => {
    const parts = text.split(/(<[a-z]+[^>]*>.*?<\/[a-z]+>)/gi);
    
    return parts.map((part, index) => {
      // General tag match to extract tag name and content
      const tagMatch = part.match(/<([a-z]+)([^>]*)>(.*)<\/\1>/i);
      
      if (tagMatch) {
        const tag = tagMatch[1].toLowerCase();
        const attributes = tagMatch[2];
        const content = tagMatch[3];
        
        let partStyle: TextStyle = {};
        let onPress: (() => void) | undefined = undefined;

        if (tag === 'b' || tag === 'strong') partStyle.fontWeight = 'bold';
        if (tag === 'i') partStyle.fontStyle = 'italic';
        if (tag === 'u') partStyle.textDecorationLine = 'underline';
        
        if (tag === 'a') {
          partStyle.textDecorationLine = 'underline';
          partStyle.color = '#3B82F6'; // Blue
          
          // Try to extract href
          const hrefMatch = attributes.match(/href=["']([^"']+)["']/i);
          const url = hrefMatch ? hrefMatch[1] : null;
          
          if (url) {
            onPress = async () => {
              try {
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                  await Linking.openURL(url);
                } else {
                  Alert.alert('Erreur', 'Impossible d\'ouvrir le lien : ' + url);
                }
              } catch (error) {
                console.error('Error opening URL:', error);
              }
            };
          }
        }
        
        return (
          <Text 
            key={index} 
            style={[defaultStyle, style, partStyle]}
            onPress={onPress}
          >
            {content}
          </Text>
        );
      }
      
      return <Text key={index} style={[defaultStyle, style]}>{part}</Text>;
    });
  };

  return (
    <View style={containerStyle}>
      <Text style={[defaultStyle, style]}>
        {parseTags(processedHtml)}
      </Text>
    </View>
  );
};
