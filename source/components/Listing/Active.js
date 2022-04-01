import React, { Component } from 'react';
import { Platform, Text, View, Image, Alert, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import { width, height, totalSize } from 'react-native-dimension';
import { COLOR_SECONDARY, COLOR_PRIMARY } from '../../../styles/common';
import { observer } from 'mobx-react';
import store from '../../Stores/orderStore';
import styles from '../../../styles/Listing/ActiveStyleSheet';
import ApiController from '../../ApiController/ApiController';
import Toast from 'react-native-simple-toast';
import SimpleListingBar from './SimpleListingBar';
import { withNavigation } from 'react-navigation';

@observer class Active extends Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      opened: false,
      loadMore: false,
      reCaller: false,
      refreshing: false
    }
  }
  static navigationOptions = {
    header: null,
  };

  componentWillMount = async () => {
    let data = store.USER_PROFILE.data.listing_types.active_listings;
    if (data.has_list) {
      data.listing.forEach(item => {
        item.checkStatus = false;
        item.added = false;
        item.removed = false;
      }); 
    }
  }

  loadMore = async (listType, pageNo) => {
    this.setState({ loadMore: true })
    let params = {
      listing_type: listType,
      next_page: pageNo
    }
    let data = store.USER_PROFILE.data.listing_types.active_listings;
    let response = await ApiController.post('my-own-listings', params);
    // console.log('Tabs loadMore=====>>>', response);
    if (response.listing && data.publish_pagination.has_next_page) {
      // forEach Loop LoadMore results
      response.listing.forEach((item) => {
        data.listing.push(item);
      })
      data.publish_pagination = response.publish_pagination;
      await this.setState({ loadMore: false })
    } else {
      await this.setState({ loadMore: false })
      // Toast.show(response.data.no_more)
    }
    await this.setState({ reCaller: false })
  }

  isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
    const paddingToBottom = 20;
    return layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
  };
  listingExpConfirmation = (id) => {
    let data = store.USER_PROFILE.data.confirmation;
    Alert.alert(
      data.title,
      data.text,
      [
        {
          text: data.btn_cancle,
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        { text: data.btn_ok, onPress: () => this.expiredListings(id) },
      ],
      { cancelable: false },
    );
  }
  expiredListings = async (list_id) => {
    this.setState({ loading: true })
    let data = store.USER_PROFILE.data.listing_types.active_listings;
    let expire_list = store.USER_PROFILE.data.listing_types.expired_listings;
    data.listing.forEach(item => {
      if (list_id === item.listing_id) {
        item.checkStatus = true;
      }
    })
    // passing event_id to api class
    let params = {
      listing_id: list_id
    }    
    let response = await ApiController.post('expire-listings', params);
    // console.log('expire listing==========================>>',response);
    if (response.success) {
      data.listing.forEach(item => {
        if (list_id === item.listing_id) {
          item.checkStatus = false;
          item.removed = true;
          if ( expire_list.has_list !== true ) {
            expire_list.has_list = true;
            expire_list.listing = [];
            expire_list.listing.push(item);
            this.setState({ loading: false })
          }
          // data.listing.splice(data.listing.indexOf(list_id), 1);
        }
      })
      this.setState({ loading: false })
      Toast.show(response.message)
      // this.props.jumpTo('create');
    } else {
      Toast.show(response.message)
      data.listing.forEach(item => {
        if (list_id === item.listing_id) {
          item.checkStatus = false;
        }
      })
      this.setState({ loading: false })
    }
  }
  listingDelConfirmation = (id) => {
    let data = store.USER_PROFILE.data.confirmation;
    Alert.alert(
      data.title,
      data.text,
      [
        {
          text: data.btn_cancle,
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        { text: data.btn_ok, onPress: () => this.deleteListing(id) },
      ],
      { cancelable: false },
    );
  }
  deleteListing = async (listing_id) => {
    this.setState({ loading: true })

    let data = store.USER_PROFILE.data.listing_types.active_listings;
    data.listing.forEach(item => {
      if (listing_id === item.listing_id) {
        item.checkStatus = true;
        console.warn('item:', item);
      }
    })
    // passing listing_id to api class
    let params = {
      listing_id: listing_id
    }
    let response = await ApiController.post('listing-del', params);
    // console.log('delete Listing==========================>>', response);
    if (response.success) {
      data.listing.forEach(item => {
        if (listing_id === item.listing_id) {
          console.warn(item);
          item.checkStatus = false;
          item.removed = true;
          // data.listing.splice(data.listing.indexOf(listing_id), 1);
        }
      })
      this.setState({ loading: false })
      Toast.show(response.message)
      // this.props.jumpTo('create');
    } else {
      Toast.show(response.message)
      data.listing.forEach(item => {
        if (listing_id === item.listing_id) {
          item.checkStatus = false;
        }
      })
      this.setState({ loading: false })
    }
  }
  _pullToRefresh = async () => {
    this.setState({ refreshing: true })
    let params = {
      listing_type: 'publish',
      next_page: 1
    }
    let data = store.USER_PROFILE.data.listing_types.active_listings;
    let response = await ApiController.post('pull-listings', params);
    // console.log('pullToRefresh=======>>>',response);       
    if (response.success) {
      if (response.data.has_list) {
        // forEach Loop LoadMore results
        data.listing_count = response.data.listing_count;
        data.listing = response.data.listing;
        response.data.listing.forEach((item) => {
          item.checkStatus = false;
          item.removed = false;
          //data.listing.push(item);
        })
        data.publish_pagination = response.data.publish_pagination;
      }else{
        data.has_list = response.data.has_list;
        data.message = response.data.message;
        data.listing_count = response.data.listing_count;
        data.publish_pagination = response.data.publish_pagination;
      }
      await this.setState({ refreshing: false })
    } else {
      await this.setState({ refreshing: false })
      // Toast.show(response.data.no_more)
    }
  }
  render() {
    let data = store.USER_PROFILE.data;
    let listVar = store.USER_PROFILE.data.listing_types.active_listings;
    let main_clr = store.settings.data.main_clr;

    return (
      <View style={styles.container}>
        {
          data.listing_types.active_listings.has_list ?
            <ScrollView
              showsVerticalScrollIndicator={false}
              onScroll={({ nativeEvent }) => {
                if (this.isCloseToBottom(nativeEvent)) {
                  if (this.state.reCaller === false) {
                    this.loadMore(data.listing_types.active_listings.listing_type, data.listing_types.active_listings.publish_pagination.next_page);
                  }
                  this.setState({ reCaller: true })
                }
              }}
              scrollEventThrottle={400}
              refreshControl={
                <RefreshControl
                  colors={['white']}
                  progressBackgroundColor={store.settings.data.main_clr}
                  tintColor={store.settings.data.main_clr}
                  refreshing={this.state.refreshing}
                  onRefresh={this._pullToRefresh}
                />
              }>
              <View style={{ backgroundColor: COLOR_PRIMARY, marginBottom: 10, width: width(100) }}>
                <Text style={{ marginVertical: 15, marginHorizontal: 10, fontWeight: 'bold', color: COLOR_SECONDARY }}>{data.listing_types.active_listings.listing_count}</Text>
              </View>

              {
                listVar.listing.map((item, key) => {
                  return (
                    <View key={key}>
                      {
                        item.removed ?
                          null
                          :
                          <SimpleListingBar key={key} item={item} _deleteListing={this.listingDelConfirmation} _expireListing={this.listingExpConfirmation} />
                      }
                    </View>
                  )
                })
              }
              {
                data.listing_types.active_listings.publish_pagination.has_next_page ?
                  <View style={{ height: height(7), width: width(100), justifyContent: 'center', alignItems: 'center' }}>
                    {
                      this.state.loadMore ?
                        <ActivityIndicator size='large' color={store.settings.data.navbar_clr} animating={true} />
                        : null
                    }
                  </View>
                  :
                  null
              }
            </ScrollView>
            :
            <View style={{ height: height(12), marginTop: 20, flexDirection: 'row', width: width(100), alignItems: 'center', backgroundColor: '#feebe6', alignSelf: 'center' }}>
              <Image source={require('../../images/profileWarning.png')} style={{ height: height(7), width: width(15), resizeMode: 'contain', marginHorizontal: 20 }} />
              <Text style={{ fontSize: totalSize(2), color: COLOR_SECONDARY }}>{data.listing_types.active_listings.message}</Text>
            </View>
        }
        {
          this.state.loading ?
            <View style={{ position: "absolute", justifyContent: 'center', alignItems: 'center', height: height(85), width: width(100), backgroundColor: 'rgba(0,0,0,0.7)' }}>
              <ActivityIndicator color='white' size='large' animating={true} />
            </View>
            :
            null
        }
      </View>
    );
  }
}

export default withNavigation(Active)