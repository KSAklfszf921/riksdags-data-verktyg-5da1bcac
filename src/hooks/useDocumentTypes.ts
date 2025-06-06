
import { useState, useEffect } from 'react';
import { searchDocuments } from '../services/riksdagApi';

interface DocumentTypeStats {
  value: string;
  label: string;
  count: number;
}

export const useDocumentTypes = () => {
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocumentTypeCounts = async () => {
      setLoading(true);
      
      // Updated with correct document types from the API
      const types = [
        { value: 'bet', label: 'Betänkande' },
        { value: 'prop', label: 'Proposition' },
        { value: 'mot', label: 'Motion' },
        { value: 'ip', label: 'Interpellation' },
        { value: 'fr', label: 'Skriftlig fråga' },
        { value: 'frs', label: 'Svar på skriftlig fråga' },
        { value: 'prot', label: 'Protokoll' },
        { value: 'dir', label: 'Kommittédirektiv' },
        { value: 'sou', label: 'Statens offentliga utredning' },
        { value: 'ds', label: 'Departementsserien' },
        { value: 'rskr', label: 'Riksdagsskrivelse' },
        { value: 'yttr', label: 'Yttrande' },
        { value: 'fpm', label: 'Fakta-PM om EU-förslag' },
        { value: 'kom', label: 'EU-förslag' },
        { value: 'SFS', label: 'Svensk författningssamling' },
        { value: 'utskdok', label: 'Utskottsdokument' },
        { value: 'eundok', label: 'EU-nämndens dokument' },
        { value: 'uprotokoll', label: 'Utskottens protokoll' }
      ];

      const typeStats: DocumentTypeStats[] = [];

      for (const type of types) {
        try {
          const result = await searchDocuments({
            doktyp: type.value,
            sz: 1
          });
          typeStats.push({
            ...type,
            count: result.totalCount
          });
        } catch (error) {
          console.error(`Error fetching count for ${type.value}:`, error);
          typeStats.push({
            ...type,
            count: 0
          });
        }
      }

      // Sortera efter antal dokument (högst först)
      typeStats.sort((a, b) => b.count - a.count);
      setDocumentTypes(typeStats);
      setLoading(false);
    };

    fetchDocumentTypeCounts();
  }, []);

  return { documentTypes, loading };
};
