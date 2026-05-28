import { useQueryClient } from '@tanstack/react-query';
import { useUploadMedia } from './useApi';
import type { MediaType, UploadMediaResponse } from '../types/api';

/**
 * Interface pour le fichier à uploader
 */
export interface UploadFileInput {
  uri: string;
  name?: string;
  fileName?: string;
  type?: string;
  mimeType?: string;
  size?: number;
  fileSize?: number;
}

/**
 * Interface pour les paramètres d'upload
 */
export interface UseMediaUploadParams {
  type: MediaType;
  file: UploadFileInput;
}

/**
 * Hook wrapper pour l'upload de média avec refetch automatique des détails amodiataire
 * 
 * Ce hook encapsule useUploadMedia et ajoute:
 * - Refetch automatique des détails amodiataire après upload réussi
 * - Gestion d'erreur améliorée
 * - État de chargement unifié
 * 
 * @param amodiataireId - ID de l'amodiataire pour lequel uploader le média
 * @returns Mutation hook avec méthodes d'upload et états
 * 
 * @example
 * ```tsx
 * const { uploadMedia, isLoading, error } = useMediaUpload(amodiataireId);
 * 
 * const handleUpload = async (file: UploadFileInput) => {
 *   try {
 *     const result = await uploadMedia({ type: 'photo', file });
 *     console.log('Upload réussi:', result.url);
 *   } catch (err) {
 *     console.error('Upload échoué:', err);
 *   }
 * };
 * ```
 */
export function useMediaUpload(amodiataireId: string) {
  const queryClient = useQueryClient();
  const uploadMutation = useUploadMedia();

  /**
   * Fonction d'upload avec refetch automatique
   */
  const uploadMedia = async (params: UseMediaUploadParams): Promise<UploadMediaResponse> => {
    try {
      // Exécuter l'upload
      const result = await uploadMutation.mutateAsync(params);

      // Refetch les détails de l'amodiataire pour mettre à jour la galerie
      await queryClient.invalidateQueries({
        queryKey: ['amodiataire', amodiataireId],
      });

      return result;
    } catch (error) {
      // Propager l'erreur pour permettre la gestion au niveau du composant
      throw error;
    }
  };

  return {
    uploadMedia,
    isLoading: uploadMutation.isPending,
    isSuccess: uploadMutation.isSuccess,
    isError: uploadMutation.isError,
    error: uploadMutation.error,
    reset: uploadMutation.reset,
  };
}
