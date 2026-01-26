import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, CreditCard,
  FileText, AlertCircle, CheckCircle, Receipt,
  DollarSign, Calendar, Users
} from 'lucide-react';
import { factureService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import StatutBadge from '../components/StatutBadge';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentFactures, setRecentFactures] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await factureService.getStatsPaiements();
      setStats(response.data);
      
      // Charger les factures récentes
      const facturesResponse = await factureService.getAll(0, 5);
      setRecentFactures(facturesResponse.data.factures || []);
    } catch (err) {
      console.error('Erreur chargement stats:', err);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatMontant = (montant) => {
    if (!montant) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* En-tête mobile-friendly */}
      <div className="px-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm sm:text-base text-gray-600">Vue d'ensemble des factures</p>
      </div>

      {/* Cartes de statistiques - responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {/* Carte Total factures */}
        <Link 
          to="/factures"
          className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4 lg:p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={20} />
            </div>
            <span className="text-base sm:text-lg font-bold text-gray-900">{stats?.nombreFactures || 0}</span>
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-700">Total factures</h3>
          <p className="text-xs text-gray-500 mt-0.5">Toutes les factures</p>
        </Link>

        {/* Carte Impayées */}
        <Link 
          to="/factures?statut=IMPAYEE"
          className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4 lg:p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={20} />
            </div>
            <span className="text-base sm:text-lg font-bold text-red-600">{stats?.impayees || 0}</span>
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-700">Impayées</h3>
          <p className="text-xs text-gray-500 mt-0.5">À suivre</p>
        </Link>

        {/* Carte Partiellement payées */}
        <Link 
          to="/factures?statut=PARTIELLEMENT_PAYEE"
          className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4 lg:p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
              <TrendingDown className="text-yellow-600" size={20} />
            </div>
            <span className="text-base sm:text-lg font-bold text-yellow-600">{stats?.partiellementPayees || 0}</span>
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-700">Partiellement payées</h3>
          <p className="text-xs text-gray-500 mt-0.5">En cours</p>
        </Link>

        {/* Carte Payées */}
        <Link 
          to="/factures?statut=PAYEE"
          className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4 lg:p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <span className="text-base sm:text-lg font-bold text-green-600">{stats?.payees || 0}</span>
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-700">Payées</h3>
          <p className="text-xs text-gray-500 mt-0.5">Réglées</p>
        </Link>
      </div>

      {/* Cartes financières - responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Carte Montant total facturé */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
              <Receipt className="text-purple-600" size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Montant facturé</h3>
              <p className="text-xs sm:text-sm text-gray-600">Total émis</p>
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
            {formatMontant(stats?.totalFactures)}
          </p>
        </div>

        {/* Carte Total des paiements */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Paiements reçus</h3>
              <p className="text-xs sm:text-sm text-gray-600">Montant perçu</p>
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-600 truncate">
            {formatMontant(stats?.totalPaiements)}
          </p>
        </div>

        {/* Carte Reste à percevoir */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
              <CreditCard className="text-red-600" size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">En attente</h3>
              <p className="text-xs sm:text-sm text-gray-600">Reste à payer</p>
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-red-600 truncate">
            {formatMontant(stats?.totalResteAPayer)}
          </p>
        </div>
      </div>

      {/* Section récentes + actions rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Factures récentes */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Factures récentes</h2>
            <Link 
              to="/factures" 
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              Voir tout
            </Link>
          </div>
          
          {loadingRecent ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : recentFactures.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <FileText className="mx-auto mb-2 text-gray-400" size={24} />
              <p className="text-sm">Aucune facture récente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentFactures.slice(0, 5).map((facture) => (
                <Link
                  key={facture.id}
                  to={`/factures/${facture.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {facture.numeroFacture}
                      </span>
                      <StatutBadge statut={facture.statutPaiement} />
                    </div>
                    <p className="text-xs text-gray-600 truncate">{facture.nomClient}</p>
                  </div>
                  <div className="flex flex-col items-end ml-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatMontant(facture.total)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(facture.dateFacturation)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Actions rapides - version mobile compacte */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/factures/new"
              className="btn btn-primary flex items-center justify-center gap-2 py-2.5 text-sm"
            >
              <FileText size={16} />
              <span>Nouvelle facture</span>
            </Link>
            <Link
              to="/factures?statut=IMPAYEE"
              className="btn bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2 py-2.5 text-sm"
            >
              <AlertCircle size={16} />
              <span>Impayées</span>
            </Link>
            <Link
              to="/factures?statut=PARTIELLEMENT_PAYEE"
              className="btn bg-yellow-500 text-white hover:bg-yellow-600 flex items-center justify-center gap-2 py-2.5 text-sm"
            >
              <TrendingDown size={16} />
              <span>Partiellement</span>
            </Link>
            <Link
              to="/factures?statut=PAYEE"
              className="btn bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2 py-2.5 text-sm"
            >
              <CheckCircle size={16} />
              <span>Payées</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Résumé du jour (optionnel pour mobile) */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4 sm:p-5 border border-primary-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
              Résumé du jour
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-primary-600">
                {stats?.nombreFactures || 0}
              </div>
              <div className="text-xs text-gray-600">Factures</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-green-600">
                {formatMontant(stats?.totalPaiements)}
              </div>
              <div className="text-xs text-gray-600">Reçus</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;