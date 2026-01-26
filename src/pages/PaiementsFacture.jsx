import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Calendar, 
  CreditCard, FileText, CheckCircle, AlertCircle, XCircle,
  TrendingUp, TrendingDown, ChevronRight, X
} from 'lucide-react';
import { factureService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';
import StatutBadge from '../components/StatutBadge';

const PaiementsFacture = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facture, setFacture] = useState(null);
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPaiements, setLoadingPaiements] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    montant: '',
    datePaiement: new Date().toISOString().split('T')[0]
  });

  const loadFacture = async () => {
    try {
      setLoading(true);
      const response = await factureService.getById(id);
      setFacture(response.data);
    } catch (err) {
      console.error('Erreur chargement facture:', err);
      setError('Erreur lors du chargement de la facture');
    } finally {
      setLoading(false);
    }
  };

  const loadPaiements = async () => {
    try {
      setLoadingPaiements(true);
      const response = await factureService.getPaiements(id);
      setPaiements(response.data || []);
    } catch (err) {
      console.error('Erreur chargement paiements:', err);
      setError('Erreur lors du chargement des paiements');
    } finally {
      setLoadingPaiements(false);
    }
  };

  useEffect(() => {
    loadFacture();
    loadPaiements();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitPaiement = async (e) => {
    e.preventDefault();
    
    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      setError('Veuillez saisir un montant valide');
      return;
    }

    const montant = parseFloat(formData.montant);
    const resteAPayer = facture?.resteAPayer || 0;

    if (montant > resteAPayer) {
      setError(`Le montant ne peut pas dépasser le reste à payer (${formatMontant(resteAPayer)})`);
      return;
    }

    try {
      setLoadingPaiements(true);
      const paiementData = {
        montant: montant,
        datePaiement: formData.datePaiement
      };

      await factureService.addPaiement(id, paiementData);
      
      setSuccess('Paiement ajouté avec succès');
      setFormData({
        montant: '',
        datePaiement: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      
      // Recharger les données
      await Promise.all([loadFacture(), loadPaiements()]);
    } catch (err) {
      console.error('Erreur ajout paiement:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout du paiement');
    } finally {
      setLoadingPaiements(false);
    }
  };

  const handleDeletePaiement = async (paiementId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce paiement ?')) {
      return;
    }

    try {
      setLoadingPaiements(true);
      await factureService.deletePaiement(id, paiementId);
      
      setSuccess('Paiement supprimé avec succès');
      await Promise.all([loadFacture(), loadPaiements()]);
    } catch (err) {
      console.error('Erreur suppression paiement:', err);
      setError('Erreur lors de la suppression du paiement');
    } finally {
      setLoadingPaiements(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateMobile = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short'
    });
  };

  const formatMontant = (montant) => {
    if (!montant) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
  };

  const formatMontantMobile = (montant) => {
    if (!montant) return '0';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
  };

  const getStatutMessage = () => {
    if (!facture) return null;
    
    if (facture.resteAPayer === 0) {
      return {
        text: 'Facture entièrement payée',
        icon: <CheckCircle size={16} className="text-green-600" />,
        color: 'text-green-600'
      };
    } else if (facture.resteAPayer === facture.total) {
      return {
        text: 'Facture impayée',
        icon: <XCircle size={16} className="text-red-600" />,
        color: 'text-red-600'
      };
    } else {
      return {
        text: 'Facture partiellement payée',
        icon: <AlertCircle size={16} className="text-yellow-600" />,
        color: 'text-yellow-600'
      };
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && !facture) return <ErrorAlert message={error} onRetry={() => navigate('/factures')} />;

  const statutMessage = getStatutMessage();

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4">
      {/* Header mobile-friendly */}
      <div className="mb-4 sm:mb-6">
        {/* Bouton retour avec meilleur placement sur mobile */}
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <button
            onClick={() => navigate(`/factures/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2 -ml-2"
          >
            <ArrowLeft size={20} />
            <span className="text-sm sm:text-base">Retour</span>
          </button>
          
          {/* Bouton ajouter paiement - position mobile */}
          <button
            onClick={() => setShowForm(!showForm)}
            className="sm:hidden btn btn-primary flex items-center gap-2 ml-auto px-3 py-2 text-sm"
            disabled={loadingPaiements}
          >
            {showForm ? (
              <X size={16} />
            ) : (
              <>
                <Plus size={16} />
                <span>Ajouter</span>
              </>
            )}
          </button>
        </div>
        
        {/* Titre et infos */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestion des paiements</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {facture?.numeroFacture} • {facture?.nomClient}
          </p>
        </div>

        {/* Bouton ajouter paiement desktop */}
        <div className="hidden sm:flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Suivez les paiements de cette facture
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary flex items-center gap-2 px-4 py-2.5"
            disabled={loadingPaiements}
          >
            <Plus size={18} />
            <span>{showForm ? 'Annuler' : 'Ajouter un paiement'}</span>
          </button>
        </div>

        {/* Messages d'alerte */}
        <div className="mt-3">
          {error && <ErrorAlert message={error} />}
          {success && <SuccessAlert message={success} />}
        </div>
      </div>

      {/* Formulaire d'ajout de paiement - Version mobile/desktop */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Nouveau paiement</h2>
            <button
              onClick={() => setShowForm(false)}
              className="sm:hidden text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmitPaiement} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Montant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (FCFA) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="montant"
                    value={formData.montant}
                    onChange={handleInputChange}
                    min="1"
                    max={facture?.resteAPayer || 0}
                    step="1"
                    className="input-field pr-12 w-full py-2.5 sm:py-3"
                    placeholder="0"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium text-sm">
                    FCFA
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Reste à payer: <span className="font-medium">{formatMontant(facture?.resteAPayer)}</span>
                </p>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date du paiement *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="datePaiement"
                    value={formData.datePaiement}
                    onChange={handleInputChange}
                    className="input-field pl-10 w-full py-2.5 sm:py-3"
                    required
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    <Calendar size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary px-4 py-2.5 text-sm sm:text-base"
                disabled={loadingPaiements}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loadingPaiements}
                className="btn btn-primary flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base"
              >
                {loadingPaiements ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Ajout...</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Ajouter le paiement</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Résumé financier - Version mobile compacte */}
      <div className="mb-4 sm:mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* En-tête résumé */}
          <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Résumé</h2>
          </div>
          
          {/* Cartes résumé */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 sm:gap-0">
            {/* Carte Total facture */}
            <div className="p-4 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-700">Total facture</h3>
                  <p className="text-xs text-gray-500">Montant initial</p>
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {formatMontant(facture?.total)}
              </p>
            </div>

            {/* Carte Total payé */}
            <div className="p-4 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp size={18} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-700">Total payé</h3>
                  <p className="text-xs text-gray-500">Montant réglé</p>
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-600 truncate">
                {formatMontant(facture?.montantPaye)}
              </p>
            </div>

            {/* Carte Reste à payer */}
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown size={18} className="text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-700">Reste à payer</h3>
                  <p className="text-xs text-gray-500">Montant restant</p>
                </div>
              </div>
              <p className={`text-xl sm:text-2xl font-bold truncate ${(facture?.resteAPayer || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatMontant(facture?.resteAPayer)}
              </p>
            </div>
          </div>
          
          {/* Barre de progression mobile/tablette */}
          <div className="px-4 sm:px-6 py-3 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {facture?.statutPaiement && <StatutBadge statut={facture.statutPaiement} />}
              </div>
              
              {statutMessage && (
                <div className={`flex items-center gap-2 text-sm ${statutMessage.color}`}>
                  {statutMessage.icon}
                  <span>{statutMessage.text}</span>
                </div>
              )}
            </div>
            
            {/* Barre de progression */}
            {facture?.total > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progression</span>
                  <span>{Math.round((facture?.montantPaye / facture?.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (facture?.montantPaye / facture?.total) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historique des paiements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* En-tête historique */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Historique des paiements</h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {paiements.length} paiement(s) enregistré(s)
              </p>
            </div>
            {paiements.length > 0 && (
              <div className="text-sm font-medium text-green-600">
                Total: {formatMontant(paiements.reduce((sum, p) => sum + (p.montant || 0), 0))}
              </div>
            )}
          </div>
        </div>

        {/* Contenu historique */}
        {loadingPaiements ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-3 text-gray-500 text-sm">Chargement des paiements...</p>
          </div>
        ) : paiements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CreditCard className="mx-auto mb-3 text-gray-400" size={40} />
            <p className="mb-2">Aucun paiement enregistré</p>
            <p className="text-sm text-gray-600 mb-4">Commencez par ajouter un paiement</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary flex items-center gap-2 mx-auto"
            >
              <Plus size={18} />
              <span>Ajouter un paiement</span>
            </button>
          </div>
        ) : (
          <>
            {/* Tableau desktop */}
            <div className="hidden sm:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paiements.map((paiement) => (
                      <tr key={paiement.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-900">{formatDate(paiement.datePaiement)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-green-100 rounded">
                              <span className="text-green-600 font-bold text-sm">FCFA</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {formatMontant(paiement.montant)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDeletePaiement(paiement.id)}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer"
                            disabled={loadingPaiements}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Total desktop */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Total des paiements :</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatMontant(paiements.reduce((sum, p) => sum + (p.montant || 0), 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Liste mobile */}
            <div className="sm:hidden">
              <div className="divide-y divide-gray-100">
                {paiements.map((paiement) => (
                  <div key={paiement.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <span className="font-bold text-green-600 text-sm">FCFA</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {formatMontantMobile(paiement.montant)} FCFA
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                              <Calendar size={12} />
                              <span>{formatDateMobile(paiement.datePaiement)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeletePaiement(paiement.id)}
                        className="p-2 text-red-600 hover:text-red-800 ml-2"
                        title="Supprimer"
                        disabled={loadingPaiements}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total mobile */}
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Total :</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatMontant(paiements.reduce((sum, p) => sum + (p.montant || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action rapide pour revenir */}
      <div className="mt-6">
        <Link
          to={`/factures/${id}`}
          className="flex items-center justify-center gap-2 text-primary-600 hover:text-primary-800 text-sm font-medium p-3"
        >
          <ArrowLeft size={16} />
          <span>Revenir à la facture</span>
        </Link>
      </div>
    </div>
  );
};

export default PaiementsFacture;