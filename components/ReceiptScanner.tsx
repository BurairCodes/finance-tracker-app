import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  Camera as CameraIcon, 
  Image as ImageIcon, 
  X, 
  DollarSign,
  Calendar,
  Tag,
  FileText,
  RotateCcw,
  Smartphone,
  Sparkles,
  CheckCircle
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { OCRService, ReceiptData } from '@/services/ocrService';
import TransactionModal from './TransactionModal';
import Theme from '@/constants/Theme';

const { width: screenWidth } = Dimensions.get('window');

interface ReceiptScannerProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function ReceiptScanner({ isVisible, onClose }: ReceiptScannerProps) {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const { addTransaction } = useTransactions(user?.id);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [manualData, setManualData] = useState({
    amount: '',
    merchant: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Web platform - show mobile-only message
  if (Platform.OS === 'web') {
    return (
      <Modal visible={isVisible} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.title}>Receipt Scanner</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.webContainer}>
            <View style={styles.webIconContainer}>
                              <LinearGradient
                  colors={Theme.colors.gradientPrimary as [string, string]}
                  style={styles.webIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                <Smartphone size={64} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.webTitle}>Mobile Only Feature</Text>
            <Text style={styles.webText}>
              The receipt scanner is only available on mobile devices. Please use the mobile app to scan receipts and add transactions.
            </Text>
            <TouchableOpacity style={styles.webButton} onPress={onClose}>
              <Text style={styles.webButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setIsScanning(true);
        setScannedImage(result.assets[0].uri);
        await analyzeReceipt(result.assets[0].base64 || '');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const analyzeReceipt = async (imageBase64: string) => {
    try {
      const userCurrency = profile?.base_currency || 'PKR';
      const receiptData = await OCRService.analyzeReceipt(imageBase64, userCurrency);
      
      setReceiptData(receiptData);
      setManualData({
        amount: receiptData.amount,
        merchant: receiptData.merchant,
        category: receiptData.category,
        date: receiptData.date,
      });
    } catch (error) {
      console.error('Error analyzing receipt:', error);
      Alert.alert('Error', 'Failed to analyze receipt. Please try manual entry.');
    }
  };

  const handleSaveTransaction = async (transactionData: {
    amount: number;
    currency: string;
    category: string;
    type: 'income' | 'expense';
    description: string;
    date: string;
  }) => {
    try {
      // Remove the manual transaction object creation and let the addTransaction hook handle it
      await addTransaction({
        amount: transactionData.amount,
        description: transactionData.description,
        category: transactionData.category,
        type: transactionData.type,
        date: transactionData.date,
        currency: transactionData.currency || 'PKR',
      });
      
      Alert.alert('Success', 'Transaction added successfully!');
      handleClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    }
  };

  const handleClose = () => {
    setScannedImage(null);
    setReceiptData(null);
    setManualData({
      amount: '',
      merchant: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowTransactionModal(false);
    onClose();
  };

  const retakePicture = () => {
    setScannedImage(null);
    setReceiptData(null);
  };



  return (
    <Modal visible={isVisible} animationType="slide">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Receipt Scanner</Text>
          <View style={styles.placeholder} />
        </View>

        {!scannedImage ? (
          /* Upload View */
          <View style={styles.uploadContainer}>
            <View style={styles.uploadArea}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={Theme.colors.gradientPrimary as [string, string]}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <CameraIcon size={48} color="#FFFFFF" />
                </LinearGradient>
              </View>
              
              <Text style={styles.uploadTitle}>Scan Receipt</Text>
              <Text style={styles.uploadSubtitle}>
                Select a receipt image from your gallery to extract transaction details using AI-powered OCR
              </Text>
              
              <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                  <Sparkles size={16} color={Theme.colors.primary} />
                  <Text style={styles.featureText}>AI-Powered Extraction</Text>
                </View>
                <View style={styles.featureItem}>
                  <CheckCircle size={16} color={Theme.colors.primary} />
                  <Text style={styles.featureText}>Automatic Categorization</Text>
                </View>
                <View style={styles.featureItem}>
                  <DollarSign size={16} color={Theme.colors.primary} />
                  <Text style={styles.featureText}>Currency Detection</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickImage}
                disabled={isScanning}
              >
                <LinearGradient
                  colors={Theme.colors.gradientPrimary as [string, string]}
                  style={styles.uploadButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isScanning ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <ImageIcon size={20} color="white" />
                      <Text style={styles.uploadButtonText}>Select Image</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Results View */
          <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: scannedImage }} style={styles.scannedImage} />
              <View style={styles.imageOverlay}>
                <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
                  <BlurView intensity={80} tint="dark" style={styles.retakeButtonBlur}>
                    <RotateCcw size={16} color="white" />
                    <Text style={styles.retakeText}>Retake</Text>
                  </BlurView>
                </TouchableOpacity>
              </View>
            </View>

            {receiptData ? (
              <View style={styles.dataContainer}>
                <View style={styles.headerRow}>
                  <Text style={styles.sectionTitle}>Extracted Data</Text>
                </View>
                
                <View style={styles.dataGrid}>
                  <View style={styles.dataCard}>
                    <View style={styles.dataCardHeader}>
                      <DollarSign size={20} color={Theme.colors.primary} />
                      <Text style={styles.dataCardTitle}>Amount</Text>
                    </View>
                    <Text style={styles.dataCardValue}>
                      {receiptData.amount || 'Not detected'}
                    </Text>
                  </View>

                  <View style={styles.dataCard}>
                    <View style={styles.dataCardHeader}>
                      <FileText size={20} color={Theme.colors.primary} />
                      <Text style={styles.dataCardTitle}>Merchant</Text>
                    </View>
                    <Text style={styles.dataCardValue}>{receiptData.merchant || 'Unknown'}</Text>
                  </View>

                  <View style={styles.dataCard}>
                    <View style={styles.dataCardHeader}>
                      <Tag size={20} color={Theme.colors.primary} />
                      <Text style={styles.dataCardTitle}>Category</Text>
                    </View>
                    <Text style={styles.dataCardValue}>{receiptData.category || 'Other'}</Text>
                  </View>

                  <View style={styles.dataCard}>
                    <View style={styles.dataCardHeader}>
                      <Calendar size={20} color={Theme.colors.primary} />
                      <Text style={styles.dataCardTitle}>Date</Text>
                    </View>
                    <Text style={styles.dataCardValue}>{receiptData.date || new Date().toISOString().split('T')[0]}</Text>
                  </View>
                </View>



                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setShowTransactionModal(true)}
                >
                                  <LinearGradient
                  colors={Theme.colors.gradientPrimary as [string, string]}
                  style={styles.editButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.editButtonText}>Edit & Save Transaction</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingCard}>
                  <ActivityIndicator size="large" color={Theme.colors.primary} />
                  <Text style={styles.loadingText}>
                    Analyzing receipt...
                  </Text>
                  <Text style={styles.loadingSubtext}>
                    This may take a few seconds
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Transaction Modal */}
        <TransactionModal
          visible={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          onSave={handleSaveTransaction}
          initialData={receiptData ? {
            amount: receiptData.amount,
            description: receiptData.merchant,
            category: receiptData.category,
            date: receiptData.date,
            currency: profile?.base_currency || 'PKR',
          } : undefined}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    minHeight: 60,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 20,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  placeholder: {
    width: 40,
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Theme.colors.background,
  },
  webIconContainer: {
    marginBottom: 24,
  },
  webIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webTitle: {
    fontSize: 24,
    color: Theme.colors.textPrimary,
    marginBottom: 16,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  webText: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 400,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  webButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  webButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  uploadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadArea: {
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  uploadTitle: {
    fontSize: 28,
    color: Theme.colors.textPrimary,
    marginBottom: 12,
    fontFamily: Theme.typography.fontFamily.bold,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  featuresContainer: {
    marginBottom: 32,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginLeft: 12,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  uploadButton: {
    width: '100%',
    borderRadius: 16,
    shadowColor: Theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  imageContainer: {
    position: 'relative',
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  scannedImage: {
    width: '100%',
    height: 250,
    borderRadius: 20,
  },
  imageOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  retakeButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  retakeButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retakeText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 6,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  dataContainer: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  rawTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  rawTextButtonText: {
    color: Theme.colors.primary,
    fontSize: 14,
    fontFamily: Theme.typography.fontFamily.medium,
    marginLeft: 6,
  },
  rawTextContainer: {
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  rawTextLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily.medium,
    marginBottom: 8,
  },
  rawText: {
    fontSize: 14,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.regular,
    lineHeight: 20,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dataCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dataCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataCardTitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginLeft: 8,
    fontFamily: Theme.typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dataCardValue: {
    fontSize: 16,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.semiBold,
    lineHeight: 20,
  },
  itemsContainer: {
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  itemsLabel: {
    fontSize: 16,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
    marginBottom: 16,
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.primary,
    marginRight: 12,
  },
  itemText: {
    fontSize: 14,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.regular,
    flex: 1,
  },
  confidenceContainer: {
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 16,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.semiBold,
    marginLeft: 8,
  },
  aiEnhancedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  aiLabel: {
    fontSize: 12,
    color: '#10B981',
    fontFamily: Theme.typography.fontFamily.medium,
    marginLeft: 6,
  },
  editButton: {
    borderRadius: 16,
    shadowColor: Theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  editButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  loadingText: {
    fontSize: 18,
    color: Theme.colors.textPrimary,
    marginTop: 20,
    fontFamily: Theme.typography.fontFamily.semiBold,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 8,
    fontFamily: Theme.typography.fontFamily.regular,
    textAlign: 'center',
  },
});
