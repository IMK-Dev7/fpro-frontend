import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Download, Share2, FileText, 
  Calendar, User, DollarSign, MoreVertical
} from 'lucide-react';
import { factureService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const ViewFacture = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facture, setFacture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingPdf, setViewingPdf] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // URL de base pour le partage
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const loadFacture = async () => {
    try {
      setLoading(true);
      const response = await factureService.getById(id);
      setFacture(response.data);
    } catch (err) {
      setError('Facture non trouvée');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await factureService.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Facture_${facture.numeroFacture}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowActionsMenu(false);
    } catch (err) {
      setError('Erreur lors du téléchargement du PDF');
    }
  };

  const handleViewPdf = async () => {
    try {
      setViewingPdf(true);
      const response = await factureService.viewPdf(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setError('Erreur lors de l\'ouverture du PDF');
    } finally {
      setViewingPdf(false);
      setShowActionsMenu(false);
    }
  };

  const handleSharePdf = async () => {
    try {
      setSharing(true);
      
      const response = await factureService.downloadPdf(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      const file = new File([blob], `Facture_${facture.numeroFacture}.pdf`, {
        type: 'application/pdf',
        lastModified: Date.now(),
      });

      const shareText = `Facture ${facture.numeroFacture}\n` +
                       `Client: ${facture.nomClient}\n` +
                       `Date: ${formatDateForShare(facture.dateFacturation)}\n` +
                       `Montant: ${formatMontantForShare(facture.total)}`;

      if (navigator.share) {
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Facture ${facture.numeroFacture}`,
              text: shareText,
              files: [file],
            });
          } else {
            // Utiliser l'URL de l'API pour le PDF
            const pdfUrl = `${API_BASE_URL}/api/factures/${id}/pdf`;
            await navigator.share({
              title: `Facture ${facture.numeroFacture}`,
              text: `${shareText}\n\nTélécharger: ${pdfUrl}`,
            });
          }
        } catch (shareError) {
          console.error('Erreur de partage:', shareError);
          fallbackWhatsAppShare();
        }
      } else {
        fallbackWhatsAppShare();
      }
    } catch (err) {
      console.error('Erreur lors de la préparation du partage:', err);
      fallbackWhatsAppShare();
    } finally {
      setSharing(false);
      setShowActionsMenu(false);
    }
  };

  const fallbackWhatsAppShare = () => {
    if (!facture) return;
    
    // Utiliser l'URL de l'API pour le PDF
    const pdfUrl = `${API_BASE_URL}/api/factures/${id}/pdf`;
    const message = `*Facture ${facture.numeroFacture}*%0A%0A` +
                    `📋 *Détails*%0A` +
                    `👤 Client: ${facture.nomClient}%0A` +
                    `📅 Date: ${formatDateForShare(facture.dateFacturation)}%0A` +
                    `💰 Montant: ${formatMontantForShare(facture.total)}%0A` +
                    `%0A` +
                    `📄 *Télécharger*%0A` +
                    `${pdfUrl}`;
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const formatDateForShare = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatMontantForShare = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(montant);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    loadFacture();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={() => navigate('/factures')} />;
  if (!facture) return null;

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header responsive */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/factures')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 -ml-2 p-2"
          >
            <ArrowLeft size={20} />
            <span className="text-sm sm:text-base">Retour</span>
          </button>
          
          {/* Menu actions mobile */}
          <div className="sm:hidden relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-2 text-gray-600 hover:text-gray-900"
              aria-label="Actions"
            >
              <MoreVertical size={20} />
            </button>
            
            {showActionsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <Link
                    to={`/factures/${id}/edit`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowActionsMenu(false)}
                  >
                    <Edit size={16} />
                    Modifier
                  </Link>
                  <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Download size={16} />
                    Télécharger PDF
                  </button>
                  <button
                    onClick={handleViewPdf}
                    disabled={viewingPdf}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <FileText size={16} />
                    {viewingPdf ? 'Chargement...' : 'Voir PDF'}
                  </button>
                  <button
                    onClick={handleSharePdf}
                    disabled={sharing}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Share2 size={16} />
                    {sharing ? 'Préparation...' : 'Partager'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Facture {facture.numeroFacture}</h1>
          <p className="text-sm sm:text-base text-gray-600">Détails de la facture</p>
        </div>
        
        {/* Actions desktop */}
        <div className="hidden sm:flex flex-wrap gap-2 mt-4">
          <Link
            to={`/factures/${id}/edit`}
            className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
          >
            <Edit size={18} />
            <span>Modifier</span>
          </Link>
          <button
            onClick={handleDownloadPdf}
            className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            disabled={viewingPdf || sharing}
          >
            <Download size={18} />
            <span>Télécharger PDF</span>
          </button>
          <button
            onClick={handleViewPdf}
            className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
            disabled={viewingPdf || sharing}
          >
            {viewingPdf ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Chargement...</span>
              </>
            ) : (
              <>
                <FileText size={18} />
                <span>Voir PDF</span>
              </>
            )}
          </button>
          <button
            onClick={handleSharePdf}
            className="btn bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
            disabled={viewingPdf || sharing}
          >
            {sharing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Préparation...</span>
              </>
            ) : (
              <>
                <Share2 size={18} />
                <span>Partager</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Informations principales en cartes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="text-blue-600" size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Client</h3>
              <p className="text-xs sm:text-sm text-gray-600">Informations client</p>
            </div>
          </div>
          <p className="text-base sm:text-lg font-medium truncate">{facture.nomClient}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="text-green-600" size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Date</h3>
              <p className="text-xs sm:text-sm text-gray-600">Date d'émission</p>
            </div>
          </div>
          <p className="text-base sm:text-lg font-medium">{formatDate(facture.dateFacturation)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="text-purple-600" size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Montant total</h3>
              <p className="text-xs sm:text-sm text-gray-600">Total de la facture</p>
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-primary-600">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'XOF',
              minimumFractionDigits: 0
            }).format(facture.total)}
          </p>
          {facture.totalEnLettres && (
            <p className="text-xs sm:text-sm text-gray-600 mt-2 truncate">{facture.totalEnLettres}</p>
          )}
        </div>
      </div>

      {/* Lignes de facture */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-4 sm:px-6 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Lignes de facture</h2>
        </div>
        
        {/* Tableau desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Désignation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qté
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix unitaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {facture.lignes.map((ligne, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {ligne.designation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ligne.quantite}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Intl.NumberFormat('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(ligne.prixUnitaire)} FCFA
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Intl.NumberFormat('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(ligne.getMontant ? ligne.getMontant() : (ligne.quantite * ligne.prixUnitaire))} FCFA
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="4" className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  Total :
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-primary-600">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'XOF',
                    minimumFractionDigits: 0
                  }).format(facture.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Liste mobile */}
        <div className="sm:hidden">
          <div className="divide-y divide-gray-200">
            {facture.lignes.map((ligne, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-sm font-medium text-gray-900">{ligne.designation}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Quantité:</span>
                    <span className="ml-2 font-medium">{ligne.quantite}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Prix unitaire:</span>
                    <span className="ml-2 font-medium">
                      {new Intl.NumberFormat('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(ligne.prixUnitaire)} FCFA
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Montant:</span>
                    <span className="ml-2 font-medium text-primary-600">
                      {new Intl.NumberFormat('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(ligne.getMontant ? ligne.getMontant() : (ligne.quantite * ligne.prixUnitaire))} FCFA
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Total mobile */}
            <div className="p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Total:</span>
                <span className="text-lg font-bold text-primary-600">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'XOF',
                    minimumFractionDigits: 0
                  }).format(facture.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informations complémentaires */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations complémentaires</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Numéro de facture</h4>
            <p className="text-gray-900 text-sm sm:text-base">{facture.numeroFacture}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Date d'émission</h4>
            <p className="text-gray-900 text-sm sm:text-base">{formatDate(facture.dateFacturation)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Total en lettres</h4>
            <p className="text-gray-900 italic text-sm sm:text-base truncate">
              {facture.totalEnLettres || 'Non disponible'}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Nombre d'articles</h4>
            <p className="text-gray-900 text-sm sm:text-base">{facture.lignes.length} article(s)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewFacture;