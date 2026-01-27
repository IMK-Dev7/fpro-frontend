import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StatutBadge from '../components/StatutBadge';
import { 
  ArrowLeft, Edit, Download, Share2, FileText, 
  Calendar, User, MoreVertical, X,
  TrendingUp, TrendingDown, CreditCard, CheckCircle,
  Receipt, DollarSign, PlusCircle, Trash2, Eye
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
  const [showMobileActions, setShowMobileActions] = useState(false);

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
      setShowMobileActions(false);
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
      setShowMobileActions(false);
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

      const shareText = `MAHAMADOU DOUCOURE & FRERES vous remercie de votre confiance !`;

      if (navigator.share) {
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Facture ${facture.numeroFacture}`,
              text: shareText,
              files: [file],
            });
          } else {
            const pdfUrl = `${API_BASE_URL}/api/factures/${id}/pdf`;
            await navigator.share({
              title: `Facture ${facture.numeroFacture}`,
              text: shareText,
              url: pdfUrl,
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
      setShowMobileActions(false);
    }
  };

  const fallbackWhatsAppShare = () => {
    if (!facture) return;
    
    const pdfUrl = `${API_BASE_URL}/api/factures/${id}/pdf`;
    const message = `MAHAMADOU DOUCOURE & FRERES vous remercie de votre confiance.%0A%0A` +
                    `Télécharger la facture: ${pdfUrl}`;
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const formatMontant = (montant) => {
    if (!montant && montant !== 0) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
  };

  const formatMontantCompact = (montant) => {
    if (!montant && montant !== 0) return '0';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  useEffect(() => {
    loadFacture();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={() => navigate('/factures')} />;
  if (!facture) return null;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4">
      {/* Header mobile-friendly */}
      <div className="mb-4 sm:mb-6">
        {/* Bouton retour et titre */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/factures')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2 -ml-2"
            >
              <ArrowLeft size={20} />
              <span className="text-sm sm:text-base">Retour</span>
            </button>
            
            {/* Titre sur mobile */}
            <h1 className="text-xl font-bold text-gray-900 sm:hidden truncate max-w-[150px]">
              {facture.numeroFacture}
            </h1>
          </div>
          
          {/* Actions mobile */}
          <div className="flex items-center gap-2 sm:hidden">
            <Link
              to={`/factures/${id}/paiements`}
              className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg"
              title="Paiements"
            >
              <CreditCard size={20} />
            </Link>
            <button
              onClick={() => setShowMobileActions(!showMobileActions)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              aria-label="Actions"
            >
              {showMobileActions ? <X size={20} /> : <MoreVertical size={20} />}
            </button>
          </div>
        </div>
        
        {/* Titre et description desktop */}
        <div className="hidden sm:block">
          <h1 className="text-2xl font-bold text-gray-900">Facture {facture.numeroFacture}</h1>
          <p className="text-gray-600">Détails de la facture</p>
        </div>

        {/* Menu actions mobile déroulant */}
        {showMobileActions && (
          <div className="sm:hidden mb-4 bg-white rounded-lg shadow border border-gray-200 animate-fadeIn">
            <div className="grid grid-cols-3 gap-2 p-3">
              <Link
                to={`/factures/${id}/edit`}
                className="flex flex-col items-center justify-center gap-1 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                onClick={() => setShowMobileActions(false)}
              >
                <Edit size={18} />
                <span className="text-xs font-medium">Modifier</span>
              </Link>
              
              <button
                onClick={handleDownloadPdf}
                className="flex flex-col items-center justify-center gap-1 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Download size={18} />
                <span className="text-xs font-medium">PDF</span>
              </button>
              
              <button
                onClick={handleViewPdf}
                disabled={viewingPdf}
                className="flex flex-col items-center justify-center gap-1 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                {viewingPdf ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700"></div>
                ) : (
                  <Eye size={18} />
                )}
                <span className="text-xs font-medium">Voir PDF</span>
              </button>
              
              <button
                onClick={handleSharePdf}
                disabled={sharing}
                className="flex flex-col items-center justify-center gap-1 p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                {sharing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700"></div>
                ) : (
                  <Share2 size={18} />
                )}
                <span className="text-xs font-medium">Partager</span>
              </button>
              
              <Link
                to={`/factures/${id}/paiements`}
                className="flex flex-col items-center justify-center gap-1 p-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                onClick={() => setShowMobileActions(false)}
              >
                <CreditCard size={18} />
                <span className="text-xs font-medium">Paiements</span>
              </Link>
            </div>
          </div>
        )}

        {/* Actions desktop */}
        <div className="hidden sm:flex flex-wrap gap-2 mt-4">
          <Link
            to={`/factures/${id}/edit`}
            className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 px-3 sm:px-4 py-2 text-sm"
          >
            <Edit size={16} />
            <span>Modifier</span>
          </Link>
          <button
            onClick={handleDownloadPdf}
            className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 px-3 sm:px-4 py-2 text-sm"
            disabled={viewingPdf || sharing}
          >
            <Download size={16} />
            <span>PDF</span>
          </button>
          <button
            onClick={handleViewPdf}
            className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2 px-3 sm:px-4 py-2 text-sm"
            disabled={viewingPdf || sharing}
          >
            {viewingPdf ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Chargement...</span>
              </>
            ) : (
              <>
                <Eye size={16} />
                <span>Voir PDF</span>
              </>
            )}
          </button>
          <button
            onClick={handleSharePdf}
            className="btn bg-green-500 text-white hover:bg-green-600 flex items-center gap-2 px-3 sm:px-4 py-2 text-sm"
            disabled={viewingPdf || sharing}
          >
            {sharing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Préparation...</span>
              </>
            ) : (
              <>
                <Share2 size={16} />
                <span>Partager</span>
              </>
            )}
          </button>
          <Link
            to={`/factures/${id}/paiements`}
            className="btn btn-primary flex items-center gap-2 px-3 sm:px-4 py-2 text-sm"
          >
            <CreditCard size={16} />
            <span>Paiements</span>
          </Link>
        </div>
      </div>

      {/* Cartes principales - responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4 sm:mb-6">
        {/* Carte Client */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <User className="text-blue-600" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Client</h3>
              <p className="text-xs sm:text-sm text-gray-600 truncate">Nom du client</p>
            </div>
          </div>
          <p className="text-base sm:text-lg font-medium truncate" title={facture.nomClient}>
            {facture.nomClient}
          </p>
        </div>

        {/* Carte Date */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <Calendar className="text-green-600" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Date</h3>
              <p className="text-xs sm:text-sm text-gray-600">Date d'émission</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-base sm:text-lg font-medium">
              {formatDateShort(facture.dateFacturation)}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(facture.dateFacturation).toLocaleDateString('fr-FR', { weekday: 'long' })}
            </p>
          </div>
        </div>

        {/* Carte Montant */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <Receipt className="text-purple-600" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Montant total</h3>
              <p className="text-xs sm:text-sm text-gray-600">Total de la facture</p>
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-primary-600 truncate">
              {formatMontant(facture.total)}
            </p>
            {facture.totalEnLettres && (
              <p className="text-xs sm:text-sm text-gray-600 mt-2 truncate" title={facture.totalEnLettres}>
                {facture.totalEnLettres}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section paiements - visible en haut sur mobile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">État des paiements</h2>
            <p className="text-xs sm:text-sm text-gray-600">Suivi des règlements</p>
          </div>
          <Link
            to={`/factures/${id}/paiements`}
            className="btn btn-primary flex items-center gap-2 w-full sm:w-auto justify-center py-2.5 text-sm"
          >
            <CreditCard size={16} />
            <span>Gérer les paiements</span>
          </Link>
        </div>
        
        {/* Cartes paiements - responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-gray-600 text-xs sm:text-sm">FCFA</span>
              <h3 className="font-medium text-gray-900 text-sm">Total</h3>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              {formatMontantCompact(facture.total)}
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-green-600" />
              <h3 className="font-medium text-gray-900 text-sm">Payé</h3>
            </div>
            <p className="text-lg sm:text-xl font-bold text-green-600 truncate">
              {formatMontantCompact(facture.montantPaye || 0)}
            </p>
          </div>
          
          <div className={`rounded-lg p-3 sm:p-4 ${facture.resteAPayer > 0 ? 'bg-red-50' : 'bg-green-50'} col-span-2 sm:col-span-1`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} className={facture.resteAPayer > 0 ? 'text-red-600' : 'text-green-600'} />
              <h3 className="font-medium text-gray-900 text-sm">Reste</h3>
            </div>
            <p className={`text-lg sm:text-xl font-bold truncate ${facture.resteAPayer > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatMontantCompact(facture.resteAPayer || 0)}
            </p>
          </div>
        </div>
        
        {/* Barre de progression et statut */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <StatutBadge statut={facture.statutPaiement} />
          
          {/* Barre de progression */}
          {facture.total > 0 && (
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progression</span>
                <span>{Math.round((facture.montantPaye / facture.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (facture.montantPaye / facture.total) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {facture.resteAPayer === 0 && (
            <div className="flex items-center gap-1 text-green-600 text-xs sm:text-sm">
              <CheckCircle size={14} />
              <span>Facture payée</span>
            </div>
          )}
        </div>
      </div>

      {/* Lignes de facture */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 sm:mb-6">
        {/* En-tête */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Lignes de facture</h2>
          <p className="text-xs sm:text-sm text-gray-600">
            {facture.lignes.length} article(s) • {formatMontant(facture.total)}
          </p>
        </div>
        
        {/* Tableau desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Désignation
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Qté
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Prix unitaire
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {facture.lignes.map((ligne, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={ligne.designation}>
                      {ligne.designation}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {ligne.quantite}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatMontant(ligne.prixUnitaire)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatMontant(ligne.quantite * ligne.prixUnitaire)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="4" className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                  Total :
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-lg font-bold text-primary-600">
                  {formatMontant(facture.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Liste mobile */}
        <div className="sm:hidden">
          <div className="divide-y divide-gray-200">
            {facture.lignes.map((ligne, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                      {ligne.designation}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary-600">
                    {formatMontantCompact(ligne.quantite * ligne.prixUnitaire)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Quantité</div>
                    <div className="font-medium">{ligne.quantite}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Prix unitaire</div>
                    <div className="font-medium">{formatMontantCompact(ligne.prixUnitaire)}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Total mobile */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Total :</span>
                <span className="text-lg font-bold text-primary-600">
                  {formatMontant(facture.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informations complémentaires */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations complémentaires</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Numéro de facture</h4>
              <p className="text-gray-900 font-medium text-sm sm:text-base">{facture.numeroFacture}</p>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Date d'émission</h4>
              <p className="text-gray-900 text-sm sm:text-base">{formatDate(facture.dateFacturation)}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Nombre d'articles</h4>
              <p className="text-gray-900 text-sm sm:text-base">{facture.lignes.length} article(s)</p>
            </div>
            {facture.totalEnLettres && (
              <div>
                <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Total en lettres</h4>
                <p className="text-gray-900 italic text-sm sm:text-base truncate-2" title={facture.totalEnLettres}>
                  {facture.totalEnLettres}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewFacture;