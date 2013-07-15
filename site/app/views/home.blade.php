@extends('_layouts.default')
@section('main')
<div id="twitter-datatable"></div>
@stop

{{-- Web site Title --}}
@section('title')
{{ $page_title }}
@stop

{{-- Page description --}}
@section('description')
{{ $page_desc }}
@stop

{{-- h1 --}}
@section('h1-title')
{{ $h1_title }}
@stop


@section('inline-javascript')
<script lang="text/javascript">
	//https://github.com/jeffdupont/bootstrap-data-table
	$("#twitter-datatable").datatable({
		perPage: 10
		, url: '/json/users/category'
		, showPagination: true
		, showTopPagination: true
		, showFilterRow: false
		, showFilter: false
		//, filterModal: $("#table-container_1-filter")
		, post: {_token: "<?php echo csrf_token();?>" }
		, title: ''
		, columns: [
			{
				title: "Rank"
				, sortable: false
				, field: "column_rank"
				, callback: function ( data, cell ) {
					return data[cell.field];
				}
				, filter: false
				, css: {
				width: '10%'
			}
			}
			, {
				title: "Profile"
				, sortable: false
				, field: "column_profile_picture"
				, css: {
					width: '20%'
				}
			}
			, {
				title: "Description"
				, sortable: false
				, field: "column_description"
				, css: {
					width: '50%'
				}
			}
			, {
				title: "Category"
				, sortable: false
				, field: "column_category"
				, css: {
					width: '10%'
				}
			}
			, {
				title: "Score"
				, sortable: false
				, field: "column_score"
				, css: {
					textAlign: 'right'
					, width: '10%'

				}
			}
		]
	});
</script>
@stop
